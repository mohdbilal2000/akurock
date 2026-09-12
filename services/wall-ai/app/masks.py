"""
Turning a semantic label map into the two masks the visualizer needs:

1. the wall to panel, and
2. everything standing in front of it, so panels render *behind* the sofa,
   the radiator and the plug socket instead of painting over them.

Class semantics are read from the model's own id2label rather than a
hardcoded ADE20K table, so swapping SegFormer for Mask2Former/OneFormer (or
any other ADE20K-trained head) needs no edits here.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

# Surfaces that are not the wall and are not in front of it either — they
# bound the room rather than occlude the panels.
BACKGROUND_NAMES = {
    "floor", "flooring", "ceiling", "sky", "road", "route", "earth", "ground",
    "grass", "water", "sea", "field", "sand", "land", "path", "dirt track",
    "runway", "hill", "mountain", "mount", "rug", "carpet", "carpeting",
    "stairs", "step", "stairway", "staircase", "escalator", "moving staircase",
    "moving stairway",
}

WALL_NAMES = {"wall"}


@dataclass(frozen=True)
class LabelSemantics:
    wall_ids: frozenset[int]
    background_ids: frozenset[int]

    def occluder_ids(self, all_ids: frozenset[int]) -> frozenset[int]:
        return frozenset(all_ids - self.wall_ids - self.background_ids)


def classify_labels(id2label: dict[int, str]) -> LabelSemantics:
    """
    Splits a model's label vocabulary into wall / background / (implicitly)
    occluder classes.

    ADE20K label strings are comma-separated synonym lists ("floor, flooring"),
    so every synonym is matched independently. Anything unrecognised counts as
    an occluder — the safe default: a mystery object left in front of the
    panels looks like a photo, one painted over looks like a bug.
    """
    wall_ids: set[int] = set()
    background_ids: set[int] = set()

    for label_id, raw in id2label.items():
        synonyms = {part.strip().lower() for part in str(raw).split(",")}
        if synonyms & WALL_NAMES:
            wall_ids.add(int(label_id))
        elif synonyms & BACKGROUND_NAMES:
            background_ids.add(int(label_id))

    return LabelSemantics(frozenset(wall_ids), frozenset(background_ids))


def dominant_wall_mask(
    labels: np.ndarray,
    semantics: LabelSemantics,
    *,
    min_area_ratio: float = 0.03,
) -> np.ndarray:
    """
    The single wall plane we are going to panel: the largest connected wall
    region, scored by area weighted towards the centre of the frame.

    A room photo usually shows two or three walls. Panelling the union of
    them would fit one plane through several, which is how you get a
    composite whose slats bend around a corner. Picking one component keeps
    the plane fit honest; the user can re-aim by tapping another wall.
    """
    wall = np.isin(labels, list(semantics.wall_ids))
    if not wall.any():
        return np.zeros_like(wall, dtype=bool)

    wall = _clean(wall)
    count, components = cv2.connectedComponents(wall.astype(np.uint8), connectivity=8)
    if count <= 1:
        return np.zeros_like(wall, dtype=bool)

    height, width = labels.shape
    centre = np.array([width / 2.0, height / 2.0])
    best_id, best_score = 0, -1.0

    for component_id in range(1, count):
        component = components == component_id
        area = float(component.sum())
        if area < min_area_ratio * labels.size:
            continue
        ys, xs = np.nonzero(component)
        offset = np.hypot(xs.mean() - centre[0], ys.mean() - centre[1])
        # Halve the score for a component whose centroid sits a full frame
        # diagonal away; a sliver of far wall shouldn't beat the wall the
        # photo is actually of.
        centrality = 1.0 / (1.0 + offset / (0.5 * np.hypot(width, height)))
        score = area * centrality
        if score > best_score:
            best_id, best_score = component_id, score

    if best_id == 0:
        return np.zeros_like(wall, dtype=bool)
    return components == best_id


def tapped_wall_mask(labels: np.ndarray, semantics: LabelSemantics, tap_xy: tuple[int, int]) -> np.ndarray:
    """The wall component under an explicit tap — the user's override when
    auto-pick lands on the wrong wall. Falls back to the dominant wall."""
    x, y = int(tap_xy[0]), int(tap_xy[1])
    height, width = labels.shape
    if not (0 <= x < width and 0 <= y < height):
        return dominant_wall_mask(labels, semantics)

    wall = _clean(np.isin(labels, list(semantics.wall_ids)))
    if not wall[y, x]:
        return dominant_wall_mask(labels, semantics)

    count, components = cv2.connectedComponents(wall.astype(np.uint8), connectivity=8)
    if count <= 1:
        return dominant_wall_mask(labels, semantics)
    return components == components[y, x]


def occluder_mask(
    labels: np.ndarray,
    semantics: LabelSemantics,
    *,
    dilate_px: int = 2,
) -> np.ndarray:
    """
    Everything that must stay in front of the panels: furniture, people,
    plants, and — the ones that give the composite away when they're missed —
    window frames, doors, curtains, radiators, sockets and wall art.

    Dilated slightly because segmentation edges run a pixel or two inside
    the object; a panel bleeding onto a sofa's outline reads as a halo.
    """
    all_ids = frozenset(int(v) for v in np.unique(labels))
    ids = semantics.occluder_ids(all_ids)
    if not ids:
        return np.zeros(labels.shape, dtype=bool)

    mask = np.isin(labels, list(ids))
    if dilate_px > 0 and mask.any():
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dilate_px + 1, 2 * dilate_px + 1))
        mask = cv2.dilate(mask.astype(np.uint8), kernel).astype(bool)
    return mask


def _clean(mask: np.ndarray, *, kernel_px: int = 5) -> np.ndarray:
    """Closes pin-holes (cable runs, socket plates) and drops speckle, so
    connected-component scoring sees regions instead of confetti."""
    if not mask.any():
        return mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_px, kernel_px))
    closed = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_CLOSE, kernel)
    opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel)
    return opened.astype(bool)


def mask_confidence(wall: np.ndarray, inlier_ratio: float) -> float:
    """
    0-1 confidence that the detected plane is worth auto-applying.

    Two independent things have to hold: the segmenter found a wall big
    enough to be the subject of the photo, and the depth points on it
    actually lie on one plane. Either failing should stop the tool from
    silently rendering a wrong-scale wall — the UI drops back to manual
    corners instead.
    """
    area_ratio = float(wall.mean())
    area_score = float(np.clip(area_ratio / 0.12, 0.0, 1.0))
    plane_score = float(np.clip((inlier_ratio - 0.45) / 0.4, 0.0, 1.0))
    return round(float(np.sqrt(area_score * plane_score)), 3)
