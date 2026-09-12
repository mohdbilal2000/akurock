"""Label-map -> mask rules, exercised on hand-built label images."""

from __future__ import annotations

import numpy as np

from app import masks

# A slice of the ADE20K vocabulary in the exact comma-separated form
# transformers' config.id2label uses.
ID2LABEL = {
    0: "wall",
    3: "floor, flooring",
    5: "ceiling",
    8: "windowpane, window",
    14: "door, double door",
    19: "chair",
    22: "painting, picture",
    23: "sofa, couch, lounge",
    28: "rug, carpet, carpeting",
    146: "radiator",
}


def semantics() -> masks.LabelSemantics:
    return masks.classify_labels(ID2LABEL)


def test_wall_floor_and_ceiling_are_classified_apart_from_objects():
    s = semantics()
    assert s.wall_ids == {0}
    assert {3, 5, 28} <= s.background_ids
    # Wall-mounted things are occluders, not wall: panels go behind them.
    assert s.occluder_ids(frozenset(ID2LABEL)) == {8, 14, 19, 22, 23, 146}


def test_unknown_classes_default_to_occluders():
    s = masks.classify_labels({0: "wall", 99: "something the model invented"})
    assert s.occluder_ids(frozenset({0, 99})) == {99}


def test_dominant_wall_prefers_the_wall_the_photo_is_of():
    labels = np.full((300, 400), 3, dtype=np.int32)  # floor everywhere
    labels[40:260, 80:330] = 0  # the main wall, centred
    labels[10:120, 0:40] = 0  # a sliver of another wall at the frame edge

    wall = masks.dominant_wall_mask(labels, semantics())

    assert wall[150, 200]  # centre of the main wall
    assert not wall[60, 10]  # the sliver is excluded
    assert not wall[280, 200]  # floor is not wall


def test_dominant_wall_ignores_specks_below_the_area_floor():
    labels = np.full((200, 200), 3, dtype=np.int32)
    labels[10:20, 10:20] = 0
    assert not masks.dominant_wall_mask(labels, semantics()).any()


def test_a_tap_picks_the_wall_under_the_finger():
    labels = np.full((300, 400), 3, dtype=np.int32)
    labels[40:260, 200:380] = 0  # big wall, right
    labels[40:260, 20:120] = 0  # smaller wall, left

    tapped = masks.tapped_wall_mask(labels, semantics(), (60, 150))

    assert tapped[150, 60]
    assert not tapped[150, 300]


def test_a_tap_off_the_wall_falls_back_to_the_dominant_wall():
    labels = np.full((300, 400), 3, dtype=np.int32)
    labels[40:260, 80:330] = 0
    tapped = masks.tapped_wall_mask(labels, semantics(), (200, 290))  # on the floor
    assert tapped[150, 200]


def test_occluders_cover_furniture_and_wall_fittings_but_not_the_room_shell():
    labels = np.full((200, 200), 0, dtype=np.int32)
    labels[150:200, :] = 3  # floor
    labels[0:20, :] = 5  # ceiling
    labels[100:150, 20:60] = 23  # sofa
    labels[40:80, 120:160] = 22  # painting
    labels[110:140, 170:190] = 146  # radiator

    occluders = masks.occluder_mask(labels, semantics(), dilate_px=0)

    assert occluders[120, 40] and occluders[60, 140] and occluders[125, 180]
    assert not occluders[170, 100]  # floor
    assert not occluders[10, 100]  # ceiling
    assert not occluders[90, 100]  # bare wall


def test_confidence_needs_both_a_real_wall_and_a_flat_plane():
    big_wall = np.zeros((100, 100), dtype=bool)
    big_wall[20:80, 10:90] = True
    speck = np.zeros((100, 100), dtype=bool)
    speck[0:3, 0:3] = True

    assert masks.mask_confidence(big_wall, 0.95) > 0.9
    assert masks.mask_confidence(big_wall, 0.4) == 0.0  # plane didn't hold
    assert masks.mask_confidence(speck, 0.95) < 0.35  # nothing worth panelling
    assert 0.0 <= masks.mask_confidence(speck, 0.4) <= 1.0
