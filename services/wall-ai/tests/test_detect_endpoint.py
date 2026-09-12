"""
End-to-end test of POST /detect with the two model calls stubbed out.

The models are the one part we can't run in CI, but everything between them
and the JSON the browser consumes — mask selection, depth sampling, plane
fit, metric measurement, corner ordering, scaling back to the uploaded
image's pixels — is exercised here against a scene whose true size is known.
"""

from __future__ import annotations

import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import inference
from app.main import app

WIDTH, HEIGHT = 800, 600
WALL_BOTTOM = 500  # rows 0..499 are wall, the rest is floor
WALL_DISTANCE_M = 3.0

ID2LABEL = {0: "wall", 3: "floor, flooring", 23: "sofa, couch, lounge", 5: "ceiling"}


def synthetic_labels(width: int = WIDTH, height: int = HEIGHT) -> np.ndarray:
    """Wall above, floor below, one sofa against the wall — built at
    whatever size the pipeline actually hands the model, so the stub stays
    honest about the downscale step."""
    bottom = round(height * WALL_BOTTOM / HEIGHT)
    labels = np.zeros((height, width), dtype=np.int32)  # wall
    labels[bottom:, :] = 3  # floor
    labels[round(height * 380 / HEIGHT) : bottom, round(width * 120 / WIDTH) : round(width * 360 / WIDTH)] = 23
    return labels


def synthetic_depth(width: int = WIDTH, height: int = HEIGHT) -> np.ndarray:
    """A frontal plane at 3m, with the sofa a metre closer."""
    bottom = round(height * WALL_BOTTOM / HEIGHT)
    depth = np.full((height, width), WALL_DISTANCE_M, dtype=np.float32)
    depth[round(height * 380 / HEIGHT) : bottom, round(width * 120 / WIDTH) : round(width * 360 / WIDTH)] = 2.0
    depth[bottom:, :] = np.linspace(2.8, 1.2, height - bottom)[:, None]
    return depth


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(inference, "ensure_loaded", lambda: None)
    monkeypatch.setattr(inference, "id2label", lambda: ID2LABEL)
    monkeypatch.setattr(
        inference,
        "segment",
        lambda image: inference.SegmentationResult(synthetic_labels(image.width, image.height), 12.0),
    )
    monkeypatch.setattr(
        inference,
        "estimate_depth",
        lambda image: inference.DepthResult(synthetic_depth(image.width, image.height), 8.0),
    )
    return TestClient(app)


def photo_bytes(size=(WIDTH, HEIGHT)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, "white").save(buffer, format="JPEG")
    return buffer.getvalue()


def post(client, **kwargs):
    return client.post("/detect", files={"photo": ("room.jpg", photo_bytes(), "image/jpeg")}, **kwargs)


def test_detect_measures_the_wall_in_metres(client):
    body = post(client).json()

    assert body["source"] == "depth-plane"
    # The visible wall is 500px tall through a 67-degree lens at 3m, which
    # is ~2.48m of real wall; the full frame is ~3.97m across.
    assert body["wall_height_mm"] == pytest.approx(2480, rel=0.08)
    assert body["wall_width_mm"] == pytest.approx(3970, rel=0.08)
    assert body["confidence"] > 0.6


def test_detect_returns_corners_inside_the_photo_in_reading_order(client):
    corners = post(client).json()["corners"]
    tl, tr, br, bl = corners

    assert tl["x"] < tr["x"] and bl["x"] < br["x"]
    assert tl["y"] < bl["y"] and tr["y"] < br["y"]
    for corner in corners:
        assert -20 <= corner["x"] <= WIDTH + 20
        assert -20 <= corner["y"] <= HEIGHT + 20


def test_detect_marks_the_sofa_as_an_occluder_and_the_wall_as_wall(client):
    body = post(client).json()

    wall = decode_mask(body["wall_mask_png"])
    occluders = decode_mask(body["occluder_mask_png"])

    assert wall[100, 400] > 128  # open wall
    assert occluders[420, 240] > 128  # the sofa
    assert occluders[100, 400] < 128  # not the open wall
    assert occluders[550, 400] < 128  # and not the floor either


def test_a_tap_still_resolves_when_it_lands_on_the_only_wall(client):
    body = post(client, data={"tap_x": "400", "tap_y": "100"}).json()
    assert body["source"] == "depth-plane"


def test_detect_reports_corners_in_the_uploaded_image_s_own_pixels(client):
    """Inference runs downscaled; the client draws on the full-size photo,
    so the quad has to come back in full-size coordinates."""
    big = io.BytesIO()
    Image.new("RGB", (2400, 1800), "white").save(big, format="JPEG")
    response = client.post("/detect", files={"photo": ("big.jpg", big.getvalue(), "image/jpeg")})
    body = response.json()

    assert body["image_width"] == 2400 and body["image_height"] == 1800
    # Corners are reported against 2400px, not the 1024px inference copy.
    assert max(c["x"] for c in body["corners"]) > 1024


def test_an_empty_upload_is_rejected(client):
    response = client.post("/detect", files={"photo": ("empty.jpg", b"", "image/jpeg")})
    assert response.status_code == 400


def test_a_photo_with_no_wall_returns_422_so_the_client_can_fall_back(client, monkeypatch):
    monkeypatch.setattr(
        inference,
        "segment",
        lambda image: inference.SegmentationResult(np.full((HEIGHT, WIDTH), 3, dtype=np.int32), 1.0),
    )
    response = post(client)
    assert response.status_code == 422


def test_depth_failure_degrades_to_an_assumed_wall_size(client, monkeypatch):
    def boom(image):
        raise RuntimeError("depth model unavailable")

    monkeypatch.setattr(inference, "estimate_depth", boom)
    body = post(client).json()

    assert body["source"] == "mask-bbox"
    assert body["wall_height_mm"] == pytest.approx(2500, abs=1)
    assert any("assumed" in note for note in body["notes"])
    assert body["corners"]  # still usable: the outline is real


def decode_mask(data_url: str) -> np.ndarray:
    import base64

    payload = base64.b64decode(data_url.split(",", 1)[1])
    return np.asarray(Image.open(io.BytesIO(payload)).convert("L"))
