export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Row-major 3x3 matrix: [a,b,c, d,e,f, g,h,i]. */
export type Mat3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
];
