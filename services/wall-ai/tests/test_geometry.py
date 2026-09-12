"""
Synthetic-scene tests for the metric pipeline's maths. No weights, no torch:
a wall is built in 3D, projected through known intrinsics, and the fit has
to recover the size we started from.
"""

from __future__ import annotations

import numpy as np
import pytest

from app import geometry as geo


def make_wall_points(
    width_m: float,
    height_m: float,
    distance_m: float,
    *,
    yaw_deg: float = 0.0,
    n: int = 4000,
    seed: int = 3,
) -> np.ndarray:
    """A rectangular wall centred in front of the camera, optionally rotated
    about the vertical axis."""
    rng = np.random.default_rng(seed)
    s = rng.uniform(-width_m / 2, width_m / 2, n)
    t = rng.uniform(-height_m / 2, height_m / 2, n)
    yaw = np.deg2rad(yaw_deg)
    right = np.array([np.cos(yaw), 0.0, np.sin(yaw)])
    up = np.array([0.0, -1.0, 0.0])
    centre = np.array([0.0, 0.0, distance_m])
    return centre + np.outer(s, right) + np.outer(t, up)


def test_focal35_uses_the_long_edge_for_portrait_photos():
    portrait = geo.intrinsics_from_focal35(1080, 1920, 26.0)
    landscape = geo.intrinsics_from_focal35(1920, 1080, 26.0)
    # Same camera, same lens, rotated 90 degrees: identical focal in pixels.
    assert portrait.fx == pytest.approx(landscape.fx)
    assert portrait.fx == pytest.approx(1920 * 26.0 / 36.0)


def test_backproject_inverts_project():
    K = geo.intrinsics_from_fov(1200, 900)
    pixels = np.array([[100.0, 200.0], [600.0, 450.0], [1100.0, 800.0]])
    depth = np.array([2.0, 3.5, 4.25])
    points = geo.backproject(pixels, depth, K)
    assert geo.project(points, K) == pytest.approx(pixels, abs=1e-6)


def test_plane_fit_recovers_a_frontal_wall_through_noise_and_outliers():
    points = make_wall_points(3.0, 2.5, 3.0)
    rng = np.random.default_rng(5)
    points = points + rng.normal(0.0, 0.01, points.shape)
    # A quarter of the samples are a sofa in front of the wall.
    outliers = np.column_stack(
        [rng.uniform(-1, 1, 1200), rng.uniform(-1, 1, 1200), rng.uniform(1.2, 2.2, 1200)]
    )
    plane = geo.fit_plane_ransac(np.vstack([points, outliers]))

    assert abs(abs(plane.normal[2]) - 1.0) < 0.02  # faces the camera
    assert plane.normal[2] < 0  # oriented back towards it
    assert 0.6 < plane.inlier_ratio < 0.95


def test_metric_rectangle_recovers_true_wall_size_head_on():
    points = make_wall_points(3.2, 2.45, 3.4)
    plane = geo.fit_plane_ransac(points)
    rect = geo.wall_rect_from_points(points, plane, geo.intrinsics_from_fov(1600, 1200))

    assert rect.width_m == pytest.approx(3.2, abs=0.1)
    assert rect.height_m == pytest.approx(2.45, abs=0.1)


def test_metric_rectangle_survives_an_angled_photo():
    """The whole point of fitting a plane rather than measuring pixels: a
    wall shot from 35 degrees off-axis is still its real size."""
    points = make_wall_points(3.0, 2.5, 3.6, yaw_deg=35.0)
    plane = geo.fit_plane_ransac(points)
    rect = geo.wall_rect_from_points(points, plane, geo.intrinsics_from_fov(1600, 1200))

    assert rect.width_m == pytest.approx(3.0, abs=0.12)
    assert rect.height_m == pytest.approx(2.5, abs=0.1)


def test_rectangle_corners_come_back_in_tl_tr_br_bl_order():
    points = make_wall_points(3.0, 2.5, 3.0)
    plane = geo.fit_plane_ransac(points)
    K = geo.intrinsics_from_fov(1600, 1200)
    tl, tr, br, bl = geo.wall_rect_from_points(points, plane, K).corners_px

    assert tl[0] < tr[0] and bl[0] < br[0]  # left corners left of right ones
    assert tl[1] < bl[1] and tr[1] < br[1]  # top corners above bottom ones
    assert geo.quad_is_sane(np.array([tl, tr, br, bl]), 1600, 1200)


def test_plane_basis_stays_upright_on_a_tilted_wall():
    points = make_wall_points(3.0, 2.5, 3.0, yaw_deg=25.0)
    plane = geo.fit_plane_ransac(points)
    _, up = geo.plane_basis(plane.normal)
    # The in-plane vertical must be world-vertical: no roll, no shear.
    assert up[1] == pytest.approx(-1.0, abs=1e-6)


def test_quad_is_sane_rejects_degenerate_and_flipped_quads():
    square = np.array([[10.0, 10.0], [90.0, 10.0], [90.0, 90.0], [10.0, 90.0]])
    assert geo.quad_is_sane(square, 100, 100)
    assert not geo.quad_is_sane(square[::-1], 100, 100)  # wound the wrong way
    assert not geo.quad_is_sane(np.zeros((4, 2)), 100, 100)  # zero area
    assert not geo.quad_is_sane(np.full((4, 2), np.nan), 100, 100)
    tiny = np.array([[0.0, 0.0], [3.0, 0.0], [3.0, 3.0], [0.0, 3.0]])
    assert not geo.quad_is_sane(tiny, 100, 100)


def test_sample_mask_points_caps_and_stays_inside_the_mask():
    mask = np.zeros((200, 300), dtype=bool)
    mask[50:150, 60:260] = True
    pixels = geo.sample_mask_points(mask, max_points=500)

    assert len(pixels) == 500
    assert mask[pixels[:, 1].astype(int), pixels[:, 0].astype(int)].all()
    assert len(geo.sample_mask_points(np.zeros((10, 10), dtype=bool))) == 0
