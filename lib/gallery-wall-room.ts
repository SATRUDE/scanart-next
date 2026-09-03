/**
 * The wall as a room, seen through a camera.
 *
 * The planner's model is flat: centimetres across the wall and up from the
 * floor. This projects it - wall, floor, prints, sofa - through a pinhole
 * camera you can orbit, into 2D polygons for an SVG. Not a renderer: a line
 * drawing with a floor grid, which is what a person wants when they ask "how
 * will this look from the sofa", and what an image model wants as a reference
 * for a room - unambiguous geometry, no realism to argue with.
 *
 * World: x across the wall (0 at its left edge), y up from the floor, z out of
 * the wall into the room. All centimetres.
 */

export interface Vec3 { x: number; y: number; z: number }
export interface Vec2 { x: number; y: number }

export interface Camera {
  /** Orbit angle round the wall's centre, degrees. 0 is face on; positive views from the right. */
  yaw: number;
  /** Camera height above the floor. */
  height: number;
  /** Distance from the point looked at. */
  distance: number;
  /** Where the camera looks: the wall's centre, at this height. */
  targetHeight: number;
  /** Vertical field of view, degrees. */
  fov: number;
}

export interface Projector {
  /** World to image pixels, or null when behind the camera. */
  project: (p: Vec3) => Vec2 | null;
  /** Depth along the view axis, for painter's ordering. */
  depth: (p: Vec3) => number;
  width: number;
  height: number;
}

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/** Build the camera for a wall of `wallWidth`, rendering into `width` x `height` pixels. */
export function makeProjector(camera: Camera, wallWidth: number, width: number, height: number): Projector {
  const yaw = (camera.yaw * Math.PI) / 180;
  const target: Vec3 = { x: wallWidth / 2, y: camera.targetHeight, z: 0 };
  const eye: Vec3 = { x: target.x + camera.distance * Math.sin(yaw), y: camera.height, z: camera.distance * Math.cos(yaw) };
  const forward = norm(sub(target, eye));
  const right = norm(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  const focal = height / 2 / Math.tan(((camera.fov / 2) * Math.PI) / 180);
  const depth = (p: Vec3) => dot(sub(p, eye), forward);
  return {
    width,
    height,
    depth,
    project: p => {
      const d = sub(p, eye);
      const z = dot(d, forward);
      if (z < 5) return null;
      return { x: width / 2 + (focal * dot(d, right)) / z, y: height / 2 - (focal * dot(d, up)) / z };
    },
  };
}

export interface Poly {
  points: Vec2[];
  /** Average depth, farthest first when sorted descending. */
  depth: number;
  kind: 'floor' | 'grid' | 'wall' | 'side' | 'eye' | 'frame' | 'mat' | 'sofa' | 'sofa-edge';
}

const quad = (proj: Projector, kind: Poly['kind'], corners: Vec3[]): Poly | null => {
  const points = corners.map(proj.project);
  if (points.some(p => p === null)) return null;
  return { kind, points: points as Vec2[], depth: corners.reduce((s, c) => s + proj.depth(c), 0) / corners.length };
};

export interface RoomInput {
  wallWidth: number;
  /** Wall height when known, else the drawing's stand-in. */
  ceiling: number;
  /** Prints as rectangles on the wall: left edge, top edge from the floor, size. */
  prints: { left: number; topFromFloor: number; w: number; h: number }[];
  sofa: { width: number; height: number; depth: number } | null;
  eyeLevel: number;
  /** How far the floor is drawn out from the wall. */
  floorDepth: number;
}

/** A box on the floor, as its six faces. */
function box(proj: Projector, kind: Poly['kind'], x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Poly[] {
  const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
  const faces: Vec3[][] = [
    [c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)], // front
    [c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)], // top
    [c(x0, y0, z0), c(x0, y0, z1), c(x0, y1, z1), c(x0, y1, z0)], // left
    [c(x1, y0, z0), c(x1, y0, z1), c(x1, y1, z1), c(x1, y1, z0)], // right
    [c(x0, y0, z0), c(x1, y0, z0), c(x1, y1, z0), c(x0, y1, z0)], // back
  ];
  return faces.map(f => quad(proj, kind, f)).filter((p): p is Poly => p !== null);
}

/**
 * Everything in the room as 2D polygons, in the order to draw them: far to
 * near, with the floor grid on the floor and the mats on the frames.
 */
export function roomPolygons(input: RoomInput, proj: Projector): Poly[] {
  const { wallWidth: W, ceiling: H, floorDepth: D } = input;
  const polys: Poly[] = [];
  const c = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

  // Side walls first (they are behind everything they touch), then the back
  // wall, then the floor.
  for (const x of [0, W]) {
    const side = quad(proj, 'side', [c(x, 0, 0), c(x, H, 0), c(x, H, D), c(x, 0, D)]);
    if (side) polys.push(side);
  }
  // The ceiling closes the box, so the picture reads as an interior.
  const ceiling = quad(proj, 'side', [c(0, H, 0), c(W, H, 0), c(W, H, D), c(0, H, D)]);
  if (ceiling) polys.push(ceiling);
  const wall = quad(proj, 'wall', [c(0, 0, 0), c(W, 0, 0), c(W, H, 0), c(0, H, 0)]);
  if (wall) polys.push(wall);
  const floor = quad(proj, 'floor', [c(0, 0, 0), c(W, 0, 0), c(W, 0, D), c(0, 0, D)]);
  if (floor) polys.push(floor);

  // Floor grid every 50 cm: depth for the eye and for the image model.
  for (let x = 50; x < W; x += 50) {
    const g = quad(proj, 'grid', [c(x, 0, 0), c(x, 0, D)]);
    if (g) polys.push(g);
  }
  for (let z = 50; z < D; z += 50) {
    const g = quad(proj, 'grid', [c(0, 0, z), c(W, 0, z)]);
    if (g) polys.push(g);
  }

  // Eye level on the wall.
  const eye = quad(proj, 'eye', [c(0, input.eyeLevel, 0), c(W, input.eyeLevel, 0)]);
  if (eye) polys.push(eye);

  // Prints: a frame just off the wall, and a mat inset within it.
  for (const p of input.prints) {
    const top = p.topFromFloor;
    const bottom = top - p.h;
    const frame = quad(proj, 'frame', [c(p.left, bottom, 1), c(p.left + p.w, bottom, 1), c(p.left + p.w, top, 1), c(p.left, top, 1)]);
    if (frame) polys.push(frame);
    const inset = Math.min(p.w, p.h) * 0.16;
    const mat = quad(proj, 'mat', [
      c(p.left + inset, bottom + inset, 1.2), c(p.left + p.w - inset, bottom + inset, 1.2),
      c(p.left + p.w - inset, top - inset, 1.2), c(p.left + inset, top - inset, 1.2),
    ]);
    if (mat) polys.push(mat);
  }

  // The sofa: a seat block and a back block, drawn as boxes, nearest faces last.
  if (input.sofa) {
    const { width, height, depth } = input.sofa;
    const x0 = (W - width) / 2;
    const x1 = x0 + width;
    const z0 = 12;
    const seat = box(proj, 'sofa', x0, x1, 0, Math.min(45, height * 0.55), z0, z0 + depth);
    const back = box(proj, 'sofa', x0, x1, 0, height, z0, z0 + Math.min(28, depth * 0.3));
    const arms = [
      ...box(proj, 'sofa', x0, x0 + 18, 0, height * 0.75, z0, z0 + depth),
      ...box(proj, 'sofa', x1 - 18, x1, 0, height * 0.75, z0, z0 + depth),
    ];
    polys.push(...[...seat, ...back, ...arms].sort((a, b) => b.depth - a.depth));
  }

  return polys;
}

export const DEFAULT_CAMERA: Camera = { yaw: 24, height: 140, distance: 420, targetHeight: 140, fov: 50 };

/**
 * The widest the camera may turn before it would step through a side wall.
 * Outside the room the near wall reads from behind and the drawing stops
 * making sense; inside it, painter's order holds. A margin keeps the camera
 * off the wall itself.
 */
export function maxYaw(wallWidth: number, distance: number, margin = 20): number {
  const reach = Math.max(0, wallWidth / 2 - margin);
  if (distance <= reach) return 70;
  return Math.min(70, (Math.asin(reach / distance) * 180) / Math.PI);
}
