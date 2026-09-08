import { describe, it, expect } from 'vitest';
import { DEFAULT_CAMERA, makeProjector, roomPolygons } from './gallery-wall-room';

describe('room projection', () => {
  it('draws a sideboard as one box and a lamp as a pole and a shade', () => {
    const proj = makeProjector(DEFAULT_CAMERA, 240, 1600, 1000);
    const one = roomPolygons({ wallWidth: 240, ceiling: 250, eyeLevel: 145, floorDepth: 260, prints: [], furniture: [{ kind: 'sideboard', x: 10, z: 5, width: 152, height: 74, depth: 37 }] }, proj);
    const lamp = roomPolygons({ wallWidth: 240, ceiling: 250, eyeLevel: 145, floorDepth: 260, prints: [], furniture: [{ kind: 'floor-lamp', x: 200, z: 10, width: 40, height: 130, depth: 40 }] }, proj);
    expect(one.filter(p => p.kind === 'sofa').length).toBe(5);
    expect(lamp.filter(p => p.kind === 'sofa-edge').length).toBe(5);
    expect(lamp.filter(p => p.kind === 'sofa').length).toBe(5);
  });

  const W = 240;
  it('puts a face-on view symmetric about the image centre', () => {
    const proj = makeProjector({ ...DEFAULT_CAMERA, yaw: 0, height: 140, targetHeight: 140 }, W, 1600, 1000);
    const left = proj.project({ x: 0, y: 140, z: 0 })!;
    const right = proj.project({ x: W, y: 140, z: 0 })!;
    expect(Math.abs(800 - left.x - (right.x - 800))).toBeLessThan(0.01);
    expect(Math.abs(left.y - 500)).toBeLessThan(0.01);
  });

  it('draws nearer things larger', () => {
    const proj = makeProjector({ ...DEFAULT_CAMERA, yaw: 0 }, W, 1600, 1000);
    const farA = proj.project({ x: 100, y: 100, z: 0 })!;
    const farB = proj.project({ x: 150, y: 100, z: 0 })!;
    const nearA = proj.project({ x: 100, y: 100, z: 150 })!;
    const nearB = proj.project({ x: 150, y: 100, z: 150 })!;
    expect(nearB.x - nearA.x).toBeGreaterThan(farB.x - farA.x);
  });

  it('refuses points behind the camera', () => {
    const proj = makeProjector({ ...DEFAULT_CAMERA, yaw: 0, distance: 100 }, W, 1600, 1000);
    expect(proj.project({ x: 120, y: 100, z: 200 })).toBeNull();
  });

  it('orders the scene far to near, floor before prints before sofa', () => {
    const proj = makeProjector(DEFAULT_CAMERA, W, 1600, 1000);
    const polys = roomPolygons({
      wallWidth: W, ceiling: 250, eyeLevel: 145, floorDepth: 260,
      prints: [{ left: 95, topFromFloor: 180, w: 50, h: 70 }],
      furniture: [{ kind: 'sofa', x: 20, z: 12, width: 200, height: 85, depth: 90 }],
    }, proj);
    const kinds = polys.map(p => p.kind);
    expect(kinds.indexOf('wall')).toBeLessThan(kinds.indexOf('frame'));
    expect(kinds.indexOf('frame')).toBeLessThan(kinds.indexOf('mat'));
    expect(kinds.indexOf('mat')).toBeLessThan(kinds.indexOf('sofa'));
    expect(kinds.filter(k => k === 'grid').length).toBeGreaterThan(4);
  });

  it('viewed from the right, the wall\'s right edge is nearer and projects taller', () => {
    const proj = makeProjector({ ...DEFAULT_CAMERA, yaw: 30 }, W, 1600, 1000);
    const edge = (x: number) => proj.project({ x, y: 0, z: 0 })!.y - proj.project({ x, y: 250, z: 0 })!.y;
    expect(edge(W)).toBeGreaterThan(edge(0));
    // And face on, both edges are the same height.
    const flat = makeProjector({ ...DEFAULT_CAMERA, yaw: 0 }, W, 1600, 1000);
    const flatEdge = (x: number) => flat.project({ x, y: 0, z: 0 })!.y - flat.project({ x, y: 250, z: 0 })!.y;
    expect(Math.abs(flatEdge(W) - flatEdge(0))).toBeLessThan(0.01);
  });
});
