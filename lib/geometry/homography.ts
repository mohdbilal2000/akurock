import type { Mat3, Point } from "./types";

/**
 * Solves the 8x8 linear system for a projective homography H (3x3, h[8]=1)
 * that maps each src[i] -> dst[i] for exactly 4 point correspondences
 * (the standard DLT / four-point algorithm). Throws if the points are
 * degenerate (collinear / duplicate), since that leaves the system singular.
 */
export function computeHomography(src: readonly Point[], dst: readonly Point[]): Mat3 {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error("computeHomography requires exactly 4 point correspondences");
  }

  // Build the 8x8 system A*h = b for h = [a,b,c,d,e,f,g,h].
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i];
    const { x: dx, y: dy } = dst[i];
    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const h = solveLinearSystem(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/** Gaussian elimination with partial pivoting for a square system A*x = b. */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let pivotVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > pivotVal) {
        pivotRow = r;
        pivotVal = Math.abs(M[r][col]);
      }
    }
    if (pivotVal < 1e-12) {
      throw new Error("computeHomography: degenerate point configuration");
    }
    if (pivotRow !== col) {
      [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
    }
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = M[row][n];
    for (let c = row + 1; c < n; c++) sum -= M[row][c] * x[c];
    x[row] = sum / M[row][row];
  }
  return x;
}

/** Applies a projective transform to a single point. */
export function applyHomography(H: Mat3, p: Point): Point {
  const [a, b, c, d, e, f, g, h, i] = H;
  const w = g * p.x + h * p.y + i;
  return {
    x: (a * p.x + b * p.y + c) / w,
    y: (d * p.x + e * p.y + f) / w,
  };
}

/** Inverts a 3x3 matrix via the adjugate; throws if singular. */
export function invertMat3(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H_ = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) {
    throw new Error("invertMat3: singular matrix");
  }
  const invDet = 1 / det;

  return [
    A * invDet, D * invDet, G * invDet,
    B * invDet, E * invDet, H_ * invDet,
    C * invDet, F * invDet, I * invDet,
  ];
}
