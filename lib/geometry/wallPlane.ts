import { computeHomography, invertMat3 } from "./homography";
import type { Mat3, Point } from "./types";

/**
 * The four corners the user clicked, in image pixel space, ordered
 * top-left, top-right, bottom-right, bottom-left (clockwise from TL) —
 * matching how CornerPicker collects clicks.
 */
export type WallCorners = readonly [Point, Point, Point, Point];

export interface WallPlane {
  corners: WallCorners;
  wallHeightMm: number;
  /** Wall width in mm, derived from the corners' aspect ratio and wallHeightMm. */
  wallWidthMm: number;
  /** Maps wall-space millimetres (origin top-left, x right, y down) -> image pixels. */
  wallToImage: Mat3;
  /** Maps image pixels -> wall-space millimetres. */
  imageToWall: Mat3;
}

/**
 * Builds the wall plane from 4 clicked image-space corners and a known
 * real-world wall height. The corners' on-screen aspect ratio (averaged
 * left/right edge vs top/bottom edge) gives the wall width in the same
 * units, which is what makes slat width and panel count physically correct.
 */
export function buildWallPlane(corners: WallCorners, wallHeightMm: number): WallPlane {
  const [tl, tr, br, bl] = corners;

  const leftEdge = distance(tl, bl);
  const rightEdge = distance(tr, br);
  const topEdge = distance(tl, tr);
  const bottomEdge = distance(bl, br);

  const avgVertical = (leftEdge + rightEdge) / 2;
  const avgHorizontal = (topEdge + bottomEdge) / 2;
  const pxPerMm = avgVertical / wallHeightMm;
  const wallWidthMm = avgHorizontal / pxPerMm;

  const wallSpaceCorners: WallCorners = [
    { x: 0, y: 0 },
    { x: wallWidthMm, y: 0 },
    { x: wallWidthMm, y: wallHeightMm },
    { x: 0, y: wallHeightMm },
  ];

  const wallToImage = computeHomography(wallSpaceCorners, corners);
  const imageToWall = invertMat3(wallToImage);

  return { corners, wallHeightMm, wallWidthMm, wallToImage, imageToWall };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
