// Projective maps between a print's rectangle and its four-corner slot in the
// photo. Ported unchanged from the wall-match prototype
// (~/brands/scandinavian-art/wall-match/prototype/geometry.js).

export type Point = [number, number];
export type Quad = [Point, Point, Point, Point];
type Mat3 = [number, number, number, number, number, number, number, number, number];

/** 3×3 (row-major) that maps unit-square (u, v, 1) to quad (x, y, w). Quad: tl, tr, br, bl. */
export function squareToQuad(q: Quad): Mat3 {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return [
    x1 - x0 + g * x1, x3 - x0 + h * x3, x0,
    y1 - y0 + g * y1, y3 - y0 + h * y3, y0,
    g, h, 1,
  ];
}

export function invert3(m: Mat3): Mat3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
    B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
    C / det, -(a * h - b * g) / det, (a * e - b * d) / det,
  ];
}

/** CSS matrix3d() that maps a w × h box (transform-origin 0 0) onto the quad. */
export function boxToQuadMatrix3d(w: number, h: number, quad: Quad): string {
  const [a, b, c, d, e, f, g, hh] = squareToQuad(quad);
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map(v => +v.toFixed(10)).join(',')})`;
}

/** Mean edge lengths of the quad, in photo pixels: [width, height]. */
export function quadSize(q: Quad): [number, number] {
  const d = (p: Point, r: Point) => Math.hypot(p[0] - r[0], p[1] - r[1]);
  return [(d(q[0], q[1]) + d(q[3], q[2])) / 2, (d(q[0], q[3]) + d(q[1], q[2])) / 2];
}

/** Move each corner away from the quad's centre by d photo pixels. */
export function expandQuad(q: Quad, d: number): Quad {
  const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4;
  return q.map(([x, y]) => {
    const n = Math.hypot(x - cx, y - cy);
    return [x + ((x - cx) / n) * d, y + ((y - cy) / n) * d];
  }) as Quad;
}
