"""Response shape shared with the Next.js client (see
lib/visualizer/detectWall.ts — keep the two in step)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PointPx(BaseModel):
    x: float
    y: float


class WallDetection(BaseModel):
    """Everything the visualizer needs to panel a wall without asking the
    user a single question."""

    corners: list[PointPx] = Field(..., min_length=4, max_length=4, description="TL, TR, BR, BL in image pixels")
    wall_width_mm: float
    wall_height_mm: float
    confidence: float
    source: Literal["depth-plane", "mask-bbox"]
    image_width: int
    image_height: int
    # PNG data URLs. The wall mask is the panelling surface; the occluder
    # mask is everything that must render in front of the panels.
    wall_mask_png: str | None = None
    occluder_mask_png: str | None = None
    timings_ms: dict[str, float] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: Literal["ok", "loading", "error"]
    seg_model: str
    depth_model: str | None
    models_loaded: bool
    detail: str | None = None
