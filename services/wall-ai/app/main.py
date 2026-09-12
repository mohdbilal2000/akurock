"""
FastAPI wrapper around the detection pipeline.

Deployed as its own Render service; the only intended caller is the Next.js
route app/api/detect-wall, which holds the shared secret and never exposes
this origin to the browser.
"""

from __future__ import annotations

import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import inference, pipeline
from .config import SETTINGS
from .schemas import HealthResponse, WallDetection

log = logging.getLogger("wall-ai")

@asynccontextmanager
async def lifespan(_: FastAPI):
    if SETTINGS.warm_on_start:
        try:
            inference.ensure_loaded()
        except Exception as exc:
            log.warning("model warm-up failed, will retry on first request: %s", exc)
    yield


app = FastAPI(title="Akurock wall detection", version="1.0.0", lifespan=lifespan)

# The browser never calls this service directly, so no origin needs to be
# allowed by default; set WALL_AI_CORS_ORIGINS only for local debugging.
import os  # noqa: E402

_origins = [o.strip() for o in os.getenv("WALL_AI_CORS_ORIGINS", "").split(",") if o.strip()]
if _origins:
    app.add_middleware(
        CORSMiddleware, allow_origins=_origins, allow_methods=["POST"], allow_headers=["*"]
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    error = inference.load_error()
    return HealthResponse(
        status="error" if error else ("ok" if inference.models_loaded() else "loading"),
        seg_model=SETTINGS.seg_model,
        depth_model=SETTINGS.depth_model if SETTINGS.enable_depth else None,
        models_loaded=inference.models_loaded(),
        detail=error,
    )


@app.post("/detect", response_model=WallDetection)
async def detect(
    photo: UploadFile = File(...),
    tap_x: float | None = Form(default=None),
    tap_y: float | None = Form(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> WallDetection:
    if SETTINGS.api_key and x_api_key != SETTINGS.api_key:
        raise HTTPException(status_code=401, detail="invalid API key")

    payload = await photo.read()
    if not payload:
        raise HTTPException(status_code=400, detail="empty upload")
    if len(payload) > SETTINGS.max_upload_bytes:
        raise HTTPException(status_code=413, detail="photo too large")

    tap = (tap_x, tap_y) if tap_x is not None and tap_y is not None else None

    try:
        return pipeline.detect(payload, tap)
    except pipeline.NoWallFound as exc:
        # 422, not 500: the photo is the problem, and the client has a
        # perfectly good manual fallback for it.
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        log.exception("detection failed")
        raise HTTPException(status_code=503, detail=f"detection unavailable: {exc}") from exc
