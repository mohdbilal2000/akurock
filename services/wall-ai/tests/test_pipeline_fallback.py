"""The no-depth path and the image plumbing around it — the parts that run
without any model weights."""

from __future__ import annotations

import base64
import io

import numpy as np
import pytest
from PIL import Image

from app import geometry as geo
from app import pipeline


def wall_mask(shape=(600, 800), box=(100, 500, 150, 650)) -> np.ndarray:
    mask = np.zeros(shape, dtype=bool)
    top, bottom, left, right = box
    mask[top:bottom, left:right] = True
    return mask


def test_bbox_fallback_returns_an_ordered_quad_around_the_mask():
    K = geo.intrinsics_from_fov(800, 600)
    rect = pipeline._bbox_rect(wall_mask(), K)
    tl, tr, br, bl = rect.corners_px

    assert tl[0] < tr[0] and bl[0] < br[0]
    assert tl[1] < bl[1] and tr[1] < br[1]
    assert geo.quad_is_sane(rect.corners_px, 800, 600)


def test_bbox_fallback_assumes_a_standard_ceiling_and_scales_width_to_match():
    K = geo.intrinsics_from_fov(800, 600)
    # 500px wide x 400px tall mask at an assumed 2.5m height -> 3.125m wide.
    rect = pipeline._bbox_rect(wall_mask(box=(100, 500, 150, 650)), K)

    assert rect.height_m == pytest.approx(2.5, abs=0.01)
    assert rect.width_m == pytest.approx(2.5 * 500 / 400, rel=0.05)


def test_bbox_fallback_keeps_perspective_on_a_receding_wall():
    """A trapezoid must stay a trapezoid — flattening it to a bounding box
    would put the panel grid on the wrong plane."""
    mask = np.zeros((600, 800), dtype=bool)
    for y in range(100, 500):
        half = int(60 + (y - 100) * 0.35)
        mask[y, 400 - half : 400 + half] = True

    tl, tr, br, bl = pipeline._bbox_rect(mask, geo.intrinsics_from_fov(800, 600)).corners_px
    top_width = tr[0] - tl[0]
    bottom_width = br[0] - bl[0]

    assert bottom_width > top_width * 1.5


def test_order_corners_normalises_any_starting_rotation():
    quad = np.array([[90.0, 90.0], [10.0, 90.0], [10.0, 10.0], [90.0, 10.0]])
    tl, tr, br, bl = pipeline._order_corners(quad)

    assert tuple(tl) == (10.0, 10.0)
    assert tuple(tr) == (90.0, 10.0)
    assert tuple(br) == (90.0, 90.0)
    assert tuple(bl) == (10.0, 90.0)


def test_downscale_preserves_aspect_and_reports_the_mapping_factor():
    image = Image.new("RGB", (4032, 3024))
    working, scale = pipeline._downscale(image, 1024)

    assert max(working.size) == 1024
    assert scale == pytest.approx(1024 / 4032)
    assert working.width / working.height == pytest.approx(4032 / 3024, rel=1e-3)

    same, unit_scale = pipeline._downscale(Image.new("RGB", (800, 600)), 1024)
    assert same.size == (800, 600) and unit_scale == 1.0


def test_exif_orientation_is_applied_when_opening():
    """Phones store rotation in EXIF; a portrait photo opened raw segments
    sideways and every corner comes back wrong."""
    buffer = io.BytesIO()
    image = Image.new("RGB", (400, 300), "white")
    exif = image.getexif()
    exif[274] = 6  # rotate 90 CW
    image.save(buffer, format="JPEG", exif=exif)

    opened = pipeline._open_image(buffer.getvalue())
    assert opened.size == (300, 400)


def test_mask_png_round_trips_as_a_single_channel_data_url():
    mask = wall_mask((40, 60), (10, 30, 15, 45))
    url = pipeline._mask_to_data_url(mask)
    assert url.startswith("data:image/png;base64,")

    decoded = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1])))
    values = np.asarray(decoded.convert("L"))
    assert values[20, 20] == 255
    assert values[5, 5] == 0


def test_fill_closes_the_holes_objects_punch_in_a_wall_mask():
    mask = wall_mask()
    mask[200:400, 300:400] = False  # a wardrobe standing against the wall

    filled = pipeline._fill(mask)

    assert filled[300, 350]  # the wall continues behind it
    assert not filled[50, 50]  # but the fill doesn't spill off the wall
