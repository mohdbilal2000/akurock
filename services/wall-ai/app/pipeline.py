"""
Photo in, wall plane out.

    segment  ->  pick one wall  ->  metric depth  ->  RANSAC plane
             ->  upright metric rectangle  ->  photo-space quad + masks

Every stage degrades instead of failing: no depth model, bad depth, or a
plane that doesn't hold together falls back to a mask-bounded quad, and a
missing wall returns a 422 the client answers with manual corners.
"""

from __future__ import annotations

import base64
import io
import time

import cv2
import numpy as np
from PIL import Image, ImageOps

from . import geometry as geo
from . import inference, masks
from .config import SETTINGS
from .schemas import PointPx, WallDetection

# With no metric depth there is no way to know a wall's real size, so the
# client is handed the same assumption it already ships as a slider default.
ASSUMED_WALL_HEIGHT_MM = 2500.0


class NoWallFound(Exception):
    """The segmenter found no wall region worth panelling."""


def detect(image_bytes: bytes, tap_xy: tuple[int, int] | None = None) -> WallDetection:
    started = time.perf_counter()
    timings: dict[str, float] = {}
    notes: list[str] = []

    original = _open_image(image_bytes)
    focal35 = _exif_focal35(image_bytes)
    working, scale = _downscale(original, SETTINGS.max_side)

    segmentation = inference.segment(working)
    timings["segment_ms"] = round(segmentation.elapsed_ms, 1)

    semantics = masks.classify_labels(inference.id2label())
    if tap_xy is not None:
        wall = masks.tapped_wall_mask(
            segmentation.labels, semantics, (int(tap_xy[0] * scale), int(tap_xy[1] * scale))
        )
    else:
        wall = masks.dominant_wall_mask(segmentation.labels, semantics)

    if not wall.any():
        raise NoWallFound("no wall region detected in the photo")

    occluders = masks.occluder_mask(segmentation.labels, semantics)
    # Only occluders standing on the wall we are panelling matter; a chair
    # across the room shouldn't punch a hole in the panels behind it.
    occluders_on_wall = occluders & _fill(wall)

    K = (
        geo.intrinsics_from_focal35(working.width, working.height, focal35)
        if focal35
        else geo.intrinsics_from_fov(working.width, working.height)
    )
    if not focal35:
        notes.append("no EXIF focal length; assumed a typical phone field of view")

    rect, source, confidence, depth_ms = _fit_wall(wall, K, working, notes)
    if depth_ms is not None:
        timings["depth_ms"] = round(depth_ms, 1)

    corners_full = rect.corners_px / scale
    if not geo.quad_is_sane(corners_full, original.width, original.height):
        raise NoWallFound("detected wall plane is degenerate")

    timings["total_ms"] = round((time.perf_counter() - started) * 1000, 1)

    return WallDetection(
        corners=[PointPx(x=float(x), y=float(y)) for x, y in corners_full],
        wall_width_mm=round(rect.width_m * 1000.0, 1),
        wall_height_mm=round(rect.height_m * 1000.0, 1),
        confidence=confidence,
        source=source,
        image_width=original.width,
        image_height=original.height,
        # Dilated a little: the clip mask's job is to stop panels spilling
        # off the wall, and a segmentation edge that sits two pixels inside
        # the real one would nibble the bottom off the panel run.
        wall_mask_png=_mask_to_data_url(_dilate(wall, 4)),
        occluder_mask_png=_mask_to_data_url(occluders_on_wall),
        timings_ms=timings,
        notes=notes,
    )


def _fit_wall(
    wall: np.ndarray,
    K: geo.Intrinsics,
    working: Image.Image,
    notes: list[str],
) -> tuple[geo.WallRect, str, float, float | None]:
    """Metric plane fit, with the flat fallback when depth can't be trusted."""
    # The 0.5-0.6 stand-in inlier ratios below are not measurements: with no
    # depth there is no plane fit to score, so confidence rests on the mask
    # alone and lands mid-scale — good enough to render, flagged as assumed.
    if not SETTINGS.enable_depth:
        notes.append("depth model disabled; wall size assumed, not measured")
        return _bbox_rect(wall, K), "mask-bbox", masks.mask_confidence(wall, 0.6), None

    try:
        depth = inference.estimate_depth(working)
    except Exception as exc:
        notes.append(f"depth unavailable ({type(exc).__name__}); wall size assumed, not measured")
        return _bbox_rect(wall, K), "mask-bbox", masks.mask_confidence(wall, 0.6), None

    # Erode before sampling: the depth map's values within a few pixels of a
    # mask boundary are a blend of the wall and whatever is in front of it,
    # and those blended points are exactly what tilts a plane fit.
    core = cv2.erode(
        wall.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    ).astype(bool)
    if core.sum() < 500:
        core = wall

    pixels = geo.sample_mask_points(core)
    depths = depth.depth_m[pixels[:, 1].astype(int), pixels[:, 0].astype(int)]
    finite = np.isfinite(depths) & (depths > 0.2) & (depths < 30.0)
    pixels, depths = pixels[finite], depths[finite]

    if len(pixels) < 200:
        notes.append("too few valid depth samples on the wall; wall size assumed, not measured")
        return _bbox_rect(wall, K), "mask-bbox", masks.mask_confidence(wall, 0.5), depth.elapsed_ms

    points = geo.backproject(pixels, depths, K)
    plane = geo.fit_plane_ransac(points)

    if plane.inlier_ratio < 0.45:
        notes.append("wall did not resolve to a single flat plane; wall size assumed, not measured")
        return _bbox_rect(wall, K), "mask-bbox", masks.mask_confidence(wall, plane.inlier_ratio), depth.elapsed_ms

    rect = geo.wall_rect_from_points(points[plane.inliers], plane, K)
    if not (1.2 <= rect.height_m <= 6.0):
        notes.append(
            f"measured wall height {rect.height_m:.2f}m is outside the plausible range; "
            "check it before ordering"
        )
    return rect, "depth-plane", masks.mask_confidence(wall, plane.inlier_ratio), depth.elapsed_ms


def _bbox_rect(wall: np.ndarray, K: geo.Intrinsics) -> geo.WallRect:
    """
    Quad from the mask alone: the wall's outline reduced to a convex
    quadrilateral, which keeps real perspective (a receding wall stays a
    trapezoid) where an axis-aligned bounding box would not.
    """
    contours, _ = cv2.findContours(wall.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv2.contourArea)
    hull = cv2.convexHull(contour)

    quad = None
    # Walk the approximation tolerance up until the hull collapses to 4
    # points; cv2.minAreaRect would throw the perspective away.
    for epsilon_ratio in (0.01, 0.02, 0.03, 0.05, 0.08):
        approx = cv2.approxPolyDP(hull, epsilon_ratio * cv2.arcLength(hull, True), True)
        if len(approx) == 4:
            quad = approx.reshape(4, 2).astype(np.float64)
            break
    if quad is None:
        box = cv2.boxPoints(cv2.minAreaRect(contour))
        quad = np.asarray(box, dtype=np.float64)

    corners_px = _order_corners(quad)

    # No depth means no measurement: assume a standard ceiling height and
    # derive the width from the quad's own aspect, which is what the client
    # did before this service existed.
    left = np.linalg.norm(corners_px[0] - corners_px[3])
    right = np.linalg.norm(corners_px[1] - corners_px[2])
    top = np.linalg.norm(corners_px[0] - corners_px[1])
    bottom = np.linalg.norm(corners_px[3] - corners_px[2])
    vertical_px = (left + right) / 2.0
    horizontal_px = (top + bottom) / 2.0
    height_m = ASSUMED_WALL_HEIGHT_MM / 1000.0
    width_m = height_m * float(horizontal_px / max(vertical_px, 1e-6))

    return geo.WallRect(
        corners_px=corners_px,
        corners_3d=np.zeros((4, 3)),
        width_m=width_m,
        height_m=height_m,
    )


def _order_corners(quad: np.ndarray) -> np.ndarray:
    """Sorts 4 points into TL, TR, BR, BL — the order the client's
    homography and corner handles expect."""
    centre = quad.mean(axis=0)
    angles = np.arctan2(quad[:, 1] - centre[1], quad[:, 0] - centre[0])
    ordered = quad[np.argsort(angles)]  # counter-clockwise in image coords
    # Rotate so the point closest to the top-left of the frame comes first.
    start = int(np.argmin(ordered.sum(axis=1)))
    ordered = np.roll(ordered, -start, axis=0)
    # argsort by angle with y pointing down gives clockwise on screen, which
    # is TL, TR, BR, BL — exactly what we want.
    return ordered


def _dilate(mask: np.ndarray, radius_px: int) -> np.ndarray:
    if radius_px <= 0 or not mask.any():
        return mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * radius_px + 1, 2 * radius_px + 1))
    return cv2.dilate(mask.astype(np.uint8), kernel).astype(bool)


def _fill(mask: np.ndarray) -> np.ndarray:
    """Convex-hull fill of a mask: the wall's full footprint including the
    holes punched in it by whatever is standing in front."""
    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return mask
    filled = np.zeros(mask.shape, dtype=np.uint8)
    cv2.fillPoly(filled, [cv2.convexHull(max(contours, key=cv2.contourArea))], 1)
    return filled.astype(bool)


def _open_image(image_bytes: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(image_bytes))
    # Phones record orientation in EXIF instead of rotating pixels; without
    # this a portrait photo segments sideways and every corner is wrong.
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


def _downscale(image: Image.Image, max_side: int) -> tuple[Image.Image, float]:
    """Returns the inference-sized copy and the factor mapping original
    pixels -> working pixels."""
    longest = max(image.width, image.height)
    if longest <= max_side:
        return image, 1.0
    scale = max_side / longest
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.LANCZOS), scale


def _exif_focal35(image_bytes: bytes) -> float | None:
    try:
        exif = Image.open(io.BytesIO(image_bytes)).getexif()
        if not exif:
            return None
        # 41989 = FocalLengthIn35mmFilm, the one EXIF tag that gives a focal
        # length without also needing the sensor's physical width.
        value = exif.get_ifd(0x8769).get(41989) or exif.get(41989)
        focal = float(value) if value else None
        return focal if focal and 8.0 <= focal <= 200.0 else None
    except Exception:
        return None


def _mask_to_data_url(mask: np.ndarray) -> str:
    """8-bit single-channel PNG data URL (255 = inside the mask)."""
    ok, buffer = cv2.imencode(".png", (mask.astype(np.uint8) * 255))
    if not ok:
        raise RuntimeError("failed to encode mask PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.tobytes()).decode("ascii")
