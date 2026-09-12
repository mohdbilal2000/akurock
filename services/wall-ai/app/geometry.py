"""
Pure 3D geometry for turning a wall mask + a metric depth map into a
real-world wall plane: no torch, no PIL, no model weights — just numpy, so
every rule in here is unit-testable against synthetic scenes (see
tests/test_geometry.py).

Camera convention throughout: OpenCV pinhole. X right, Y down, Z forward
(into the scene), origin at the optical centre, pixels (u, v) with v
increasing downward. "Up" in the real world is therefore -Y.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np

# A phone's main camera is ~65-70 deg horizontal. Used only when EXIF
# carries no focal length; the plane fit is fairly forgiving of a 5-10 deg
# error, but the metric extents are not, so EXIF is always preferred.
DEFAULT_HFOV_DEG = 67.0

# 35mm full frame is 36mm wide — the conversion EXIF's
# FocalLengthIn35mmFilm is defined against.
FULL_FRAME_WIDTH_MM = 36.0


@dataclass(frozen=True)
class Intrinsics:
    fx: float
    fy: float
    cx: float
    cy: float

    def as_matrix(self) -> np.ndarray:
        return np.array(
            [[self.fx, 0.0, self.cx], [0.0, self.fy, self.cy], [0.0, 0.0, 1.0]],
            dtype=np.float64,
        )


def intrinsics_from_fov(width: int, height: int, hfov_deg: float = DEFAULT_HFOV_DEG) -> Intrinsics:
    """Square-pixel intrinsics from a horizontal field of view."""
    fx = (width / 2.0) / np.tan(np.deg2rad(hfov_deg) / 2.0)
    return Intrinsics(fx=float(fx), fy=float(fx), cx=width / 2.0, cy=height / 2.0)


def intrinsics_from_focal35(width: int, height: int, focal35_mm: float) -> Intrinsics:
    """
    Intrinsics from EXIF's 35mm-equivalent focal length. The equivalence is
    defined on the *long* edge of the frame, so a portrait photo has to be
    scaled by its height, not its width — getting this backwards is a ~30%
    scale error on every portrait phone shot, which is most of them.
    """
    long_edge = float(max(width, height))
    f_px = long_edge * float(focal35_mm) / FULL_FRAME_WIDTH_MM
    return Intrinsics(fx=f_px, fy=f_px, cx=width / 2.0, cy=height / 2.0)


def backproject(pixels: np.ndarray, depth: np.ndarray, K: Intrinsics) -> np.ndarray:
    """
    (N,2) pixel coordinates + (N,) metric depth -> (N,3) camera-space points.
    `depth` is distance along Z (not ray length), which is what monocular
    metric depth models predict.
    """
    u = pixels[:, 0].astype(np.float64)
    v = pixels[:, 1].astype(np.float64)
    z = depth.astype(np.float64)
    x = (u - K.cx) * z / K.fx
    y = (v - K.cy) * z / K.fy
    return np.stack([x, y, z], axis=1)


def project(points: np.ndarray, K: Intrinsics) -> np.ndarray:
    """(N,3) camera-space points -> (N,2) pixels. Points behind the camera
    are projected anyway; callers that care must check Z themselves."""
    z = np.where(np.abs(points[:, 2]) < 1e-9, 1e-9, points[:, 2])
    u = K.fx * points[:, 0] / z + K.cx
    v = K.fy * points[:, 1] / z + K.cy
    return np.stack([u, v], axis=1)


@dataclass(frozen=True)
class Plane:
    """n . X + d = 0, with |n| = 1 and n pointing back towards the camera."""

    normal: np.ndarray
    d: float
    inliers: np.ndarray  # bool mask over the points passed to the fit
    inlier_ratio: float

    def distance(self, points: np.ndarray) -> np.ndarray:
        return points @ self.normal + self.d


def fit_plane_ransac(
    points: np.ndarray,
    *,
    threshold_m: float = 0.04,
    iterations: int = 240,
    seed: int = 7,
) -> Plane:
    """
    RANSAC plane fit, refined by least squares on the inliers.

    A wall mask always drags in some non-wall depth — mask bleed at edges,
    a poster the segmenter called wall, depth haloes around furniture. A
    plain least-squares fit tilts towards that noise; RANSAC keeps the fit
    on the dominant plane and hands back which points actually belong to it.
    """
    if len(points) < 3:
        raise ValueError("need at least 3 points to fit a plane")

    rng = np.random.default_rng(seed)
    best_inliers = np.zeros(len(points), dtype=bool)
    best_count = -1

    for _ in range(iterations):
        idx = rng.choice(len(points), size=3, replace=False)
        a, b, c = points[idx]
        n = np.cross(b - a, c - a)
        norm = np.linalg.norm(n)
        if norm < 1e-9:
            continue
        n = n / norm
        d = -float(n @ a)
        inliers = np.abs(points @ n + d) < threshold_m
        count = int(inliers.sum())
        if count > best_count:
            best_count = count
            best_inliers = inliers

    if best_count < 3:
        best_inliers = np.ones(len(points), dtype=bool)

    normal, d = _least_squares_plane(points[best_inliers])

    # Re-score with the refined plane so inlier_ratio describes what we
    # actually return, and orient the normal towards the camera (-Z).
    inliers = np.abs(points @ normal + d) < threshold_m
    if normal[2] > 0:
        normal, d = -normal, -d

    return Plane(
        normal=normal,
        d=float(d),
        inliers=inliers,
        inlier_ratio=float(inliers.mean()),
    )


def _least_squares_plane(points: np.ndarray) -> tuple[np.ndarray, float]:
    """Total-least-squares plane through a point cloud (smallest singular
    vector of the centred points)."""
    centroid = points.mean(axis=0)
    _, _, vt = np.linalg.svd(points - centroid, full_matrices=False)
    normal = vt[-1]
    normal = normal / np.linalg.norm(normal)
    return normal, -float(normal @ centroid)


def plane_basis(normal: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    In-plane (right, up) unit vectors for a wall.

    Gravity is the anchor: the wall's vertical axis is world-up projected
    into the plane, so the panel grid stands upright even when the photo is
    taken from hip height at an angle. Deriving the basis from the mask's
    pixel extent instead would let a tilted photo shear the whole layout.
    """
    up = np.array([0.0, -1.0, 0.0])
    v = up - (up @ normal) * normal
    norm = np.linalg.norm(v)
    if norm < 1e-6:
        # Degenerate: the "wall" is a floor or ceiling. Any in-plane axis
        # will do; callers gate on confidence before trusting this.
        v = np.array([1.0, 0.0, 0.0]) - normal[0] * normal
        v = v / np.linalg.norm(v)
    else:
        v = v / norm

    h = np.cross(v, normal)
    h = h / np.linalg.norm(h)
    if h[0] < 0:  # keep +h pointing towards image-right
        h = -h
    return h, v


@dataclass(frozen=True)
class WallRect:
    """A metric rectangle on the wall plane, plus where it lands in the photo."""

    corners_px: np.ndarray  # (4,2) TL, TR, BR, BL in pixels
    corners_3d: np.ndarray  # (4,3) same order, camera space
    width_m: float
    height_m: float


def _trimmed_extent(values: np.ndarray, trim_pct: float) -> tuple[float, float]:
    """
    Percentile extent, corrected back to the full span it was trimmed from.

    Trimming keeps a handful of stray mask pixels from stretching a 3m wall
    into a 6m one, but on a wall that IS evenly sampled it shaves 2 x trim%
    off the answer — a systematic under-measure that would under-order
    panels. Re-expanding about the midpoint by the same fraction removes the
    bias while keeping the outlier rejection.
    """
    lo = float(np.percentile(values, trim_pct))
    hi = float(np.percentile(values, 100.0 - trim_pct))
    mid = (lo + hi) / 2.0
    half = (hi - lo) / 2.0 / max(1.0 - 2.0 * trim_pct / 100.0, 0.5)
    return mid - half, mid + half


def wall_rect_from_points(
    points: np.ndarray,
    plane: Plane,
    K: Intrinsics,
    *,
    trim_pct: float = 1.5,
) -> WallRect:
    """
    The largest upright rectangle covering the wall's point cloud.

    Points are projected onto the plane and measured in its (right, up)
    basis; extents are taken at percentiles rather than min/max so a few
    stray mask pixels can't stretch a 3m wall into a 6m one. The result is
    re-projected to give the photo-space quad the compositor warps into.
    """
    h, v = plane_basis(plane.normal)

    # Project every point onto the plane before measuring, so depth noise
    # perpendicular to the wall doesn't leak into the in-plane extents.
    flattened = points - np.outer(plane.distance(points), plane.normal)
    origin = flattened.mean(axis=0)
    local = flattened - origin
    s = local @ h
    t = local @ v

    s_min, s_max = _trimmed_extent(s, trim_pct)
    t_min, t_max = _trimmed_extent(t, trim_pct)

    # Order: top-left, top-right, bottom-right, bottom-left. +v is up, so
    # the "top" corners take t_max.
    corners_3d = np.array(
        [
            origin + s_min * h + t_max * v,
            origin + s_max * h + t_max * v,
            origin + s_max * h + t_min * v,
            origin + s_min * h + t_min * v,
        ]
    )

    return WallRect(
        corners_px=project(corners_3d, K),
        corners_3d=corners_3d,
        width_m=float(s_max - s_min),
        height_m=float(t_max - t_min),
    )


def quad_is_sane(corners_px: np.ndarray, width: int, height: int) -> bool:
    """
    Rejects quads that are unusable downstream: degenerate, inverted, or so
    far outside the frame that the homography would be extrapolating.
    """
    if corners_px.shape != (4, 2) or not np.isfinite(corners_px).all():
        return False

    margin = 2.0 * max(width, height)
    if (corners_px < -margin).any() or (corners_px[:, 0] > width + margin).any():
        return False
    if (corners_px[:, 1] > height + margin).any():
        return False

    area = _shoelace(corners_px)
    if area <= 0:  # negative => corner order flipped
        return False
    return area > 0.01 * width * height


def _shoelace(poly: np.ndarray) -> float:
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y))


def sample_mask_points(
    mask: np.ndarray,
    *,
    max_points: int = 20000,
    seed: int = 11,
) -> np.ndarray:
    """Evenly-subsampled (N,2) pixel coordinates of a boolean mask."""
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return np.zeros((0, 2), dtype=np.float64)
    if len(xs) > max_points:
        rng = np.random.default_rng(seed)
        idx = rng.choice(len(xs), size=max_points, replace=False)
        xs, ys = xs[idx], ys[idx]
    return np.stack([xs, ys], axis=1).astype(np.float64)


def median_depth(depth: np.ndarray, pixels: Iterable[tuple[float, float]]) -> float:
    values = [float(depth[int(round(v)), int(round(u))]) for u, v in pixels]
    return float(np.median(values))
