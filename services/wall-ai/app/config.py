"""Environment-driven settings. Every model choice is overridable so the
service can be traded up (b2 -> b4, small -> base) on a bigger dyno without
a code change."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, "").strip() or default)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # SegFormer-B2 is the quality/latency knee on CPU: ~1.5s at 512px versus
    # ~4s for B4, for a couple of mIoU. B0 (WALL_AI_SEG_MODEL override) runs
    # in well under a second when the host is small.
    seg_model: str = os.getenv("WALL_AI_SEG_MODEL", "nvidia/segformer-b2-finetuned-ade-512-512")
    # Metric (not relative) depth is the point: it gives the wall's real
    # height and width in metres, so nobody has to type a wall height and
    # panel counts are true to scale straight out of the photo.
    depth_model: str = os.getenv(
        "WALL_AI_DEPTH_MODEL", "depth-anything/Depth-Anything-V2-Metric-Indoor-Small-hf"
    )
    enable_depth: bool = _env_bool("WALL_AI_ENABLE_DEPTH", True)
    device: str = os.getenv("WALL_AI_DEVICE", "cpu")
    # Inference runs on the downscaled copy; masks and corners are returned
    # in the uploaded image's own pixel space.
    max_side: int = _env_int("WALL_AI_MAX_SIDE", 1024)
    max_upload_bytes: int = _env_int("WALL_AI_MAX_UPLOAD_BYTES", 12 * 1024 * 1024)
    # Optional shared secret. The Next.js route is the only intended caller,
    # so setting this keeps the GPU-less-but-still-expensive endpoint from
    # being used as free compute by anyone who finds the URL.
    api_key: str = os.getenv("WALL_AI_API_KEY", "")
    warm_on_start: bool = _env_bool("WALL_AI_WARM_ON_START", False)


SETTINGS = Settings()
