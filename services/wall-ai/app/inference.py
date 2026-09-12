"""
Model loading and raw inference. Everything torch/transformers-shaped lives
here so the rest of the service (geometry, masks, layout) stays importable —
and unit-testable — on a machine with no weights and no torch.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field

import numpy as np
from PIL import Image

from .config import SETTINGS


@dataclass
class _Registry:
    seg_processor: object | None = None
    seg_model: object | None = None
    depth_pipeline: object | None = None
    id2label: dict[int, str] = field(default_factory=dict)
    error: str | None = None


_registry = _Registry()
# Model load is minutes on a cold dyno and torch modules are not re-entrant;
# one lock guards both the load and inference so concurrent requests queue
# instead of thrashing a single CPU allocation.
_lock = threading.Lock()


def models_loaded() -> bool:
    return _registry.seg_model is not None


def load_error() -> str | None:
    return _registry.error


def ensure_loaded() -> None:
    """Idempotent, thread-safe model load. Called on first request (and
    optionally at startup via WALL_AI_WARM_ON_START)."""
    if models_loaded():
        return
    with _lock:
        if models_loaded():
            return
        try:
            _load()
            _registry.error = None
        except Exception as exc:  # surfaced through /health and a 503
            _registry.error = f"{type(exc).__name__}: {exc}"
            raise


def _load() -> None:
    import torch
    from transformers import AutoImageProcessor, AutoModelForSemanticSegmentation, pipeline

    torch.set_grad_enabled(False)
    # A web dyno gets one or two cores; letting torch spawn a thread per
    # core on top of uvicorn's workers makes inference slower, not faster.
    torch.set_num_threads(max(1, min(4, (torch.get_num_threads() or 1))))

    processor = AutoImageProcessor.from_pretrained(SETTINGS.seg_model)
    model = AutoModelForSemanticSegmentation.from_pretrained(SETTINGS.seg_model)
    model.eval().to(SETTINGS.device)

    _registry.seg_processor = processor
    _registry.seg_model = model
    _registry.id2label = {int(k): str(v) for k, v in model.config.id2label.items()}

    if SETTINGS.enable_depth:
        _registry.depth_pipeline = pipeline(
            "depth-estimation", model=SETTINGS.depth_model, device=SETTINGS.device
        )


def id2label() -> dict[int, str]:
    return dict(_registry.id2label)


@dataclass
class SegmentationResult:
    labels: np.ndarray  # (H, W) int32 class ids at the input image's size
    elapsed_ms: float


def segment(image: Image.Image) -> SegmentationResult:
    """Semantic segmentation, upsampled back to the input image's size."""
    import torch

    ensure_loaded()
    started = time.perf_counter()

    with _lock:
        inputs = _registry.seg_processor(images=image, return_tensors="pt").to(SETTINGS.device)
        outputs = _registry.seg_model(**inputs)
        # SegFormer emits logits at 1/4 resolution; bilinear back to the
        # photo's size before argmax so mask edges land on real edges.
        logits = torch.nn.functional.interpolate(
            outputs.logits,
            size=(image.height, image.width),
            mode="bilinear",
            align_corners=False,
        )
        labels = logits.argmax(dim=1)[0].to("cpu").numpy().astype(np.int32)

    return SegmentationResult(labels=labels, elapsed_ms=(time.perf_counter() - started) * 1000)


@dataclass
class DepthResult:
    depth_m: np.ndarray  # (H, W) float32 metres
    elapsed_ms: float


def estimate_depth(image: Image.Image) -> DepthResult:
    """Metric monocular depth in metres, resampled to the image's size."""
    ensure_loaded()
    if _registry.depth_pipeline is None:
        raise RuntimeError("depth estimation is disabled (WALL_AI_ENABLE_DEPTH=0)")

    started = time.perf_counter()
    with _lock:
        prediction = _registry.depth_pipeline(image)

    depth = prediction["predicted_depth"]
    array = np.asarray(depth.squeeze().to("cpu").float().numpy() if hasattr(depth, "to") else depth, dtype=np.float32)

    if array.shape != (image.height, image.width):
        import cv2

        array = cv2.resize(array, (image.width, image.height), interpolation=cv2.INTER_LINEAR)

    return DepthResult(depth_m=array, elapsed_ms=(time.perf_counter() - started) * 1000)
