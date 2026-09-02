import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dropping a print must commit exactly what the placeholder showed.
 *
 * The first version of this drag left the wall untouched while you dragged and
 * slid the other prints aside with transforms, then reordered for real on
 * release. That could only ever approximate the result, so releasing snapped
 * the wall into an arrangement different from the one under your finger. It
 * was reported as the drag being broken, twice, in different words.
 *
 * The fix is structural rather than a tuned constant: the wall RENDERS the
 * previewed arrangement, and the drop commits exactly that. So the guard is
 * structural too. These read the source because the property lives in which
 * value gets rendered and committed, and a jsdom drag cannot see it - jsdom
 * has no layout, so every offset it reports is zero and a wall that reflowed
 * wrongly would pass.
 */
describe('gallery wall drag commits what it previews', () => {
  const source = readFileSync(join(process.cwd(), 'components/GalleryWallCalculator.tsx'), 'utf8');
  const between = (start: string, end: string) => source.slice(source.indexOf(start), source.indexOf(end));

  it('commits the previewed arrangement on release, and decides nothing else there', () => {
    expect(source).toMatch(/const next = normalize\(displayPrints, sizeOf\);\s*setPrints\(next\);/);
    // A second snap or resolve on release is the old bug in new clothes: it
    // can disagree with the placeholder, and did.
    const inUp = between('const onWallPointerUp', '/* --------------------------------------------------------------- derived */');
    expect(inUp).not.toMatch(/\bresolve\(/);
    expect(inUp).not.toMatch(/\bsnap\(/);
  });

  it('measures and draws the wall from the previewed prints', () => {
    // The figures, the drawing and the hanging plan all project from one
    // `placed` list, and that list comes from displayPrints.
    expect(source).toMatch(/const rects = displayPrints\.map\(rectOf\)/);
    expect(source).toMatch(/const placed = displayPrints\.map/);
    expect(source).toMatch(/\{placed\.map\(\(\{ print, rect, left, topFromFloor \}\) =>/);
    expect(source).not.toMatch(/prints\.map\(rectOf\)\.map/);
  });

  it('positions prints from the model rather than faking a reflow with transforms', () => {
    expect(source).not.toMatch(/shiftFor/);
    expect(source).not.toMatch(/translateX\(\$\{shift\}px\)/);
    expect(source).toMatch(/left: x\(left\)/);
    expect(source).toMatch(/top: y\(topFromFloor\)/);
  });

  it('holds the group offset for the whole drag', () => {
    // The group re-centres around its contents. Letting it do so under a
    // moving pointer shifts the pointer's own position every move: a loop.
    expect(source).toMatch(/const offset = drag && !drag\.settle \? drag\.offset : placeGroup\(/);
    const inMove = between('const onWallPointerMove', 'const onWallPointerUp');
    expect(inMove).toMatch(/press\.offset\.left/);
    expect(inMove).toMatch(/press\.offset\.topFromFloor/);
  });

  it('reads one rect from the DOM while dragging: the wall, for projection', () => {
    const inMove = between('const onWallPointerMove', 'const onWallPointerUp');
    expect(inMove.match(/getBoundingClientRect\(\)/g)?.length).toBe(1);
    expect(inMove).toMatch(/wall\.getBoundingClientRect\(\)/);
    expect(inMove).toMatch(/\bresolve\(proposed, others, safeGap, SNAP_RADIUS_CM/);
  });

  it('captures the pointer on the wall, not on the print', () => {
    expect(source).toMatch(/wallRef\.current\?\.setPointerCapture\(event\.pointerId\)/);
    expect(source).not.toMatch(/currentTarget\.setPointerCapture/);
  });

  it('keeps every print identifiable', () => {
    expect(source).toMatch(/data-print-id=\{print\.id\}/);
    expect(source).toMatch(/key=\{print\.id\}/);
  });

  it('keeps a keyboard path for every pointer action', () => {
    // WCAG 2.1.1 and 2.5.7: dragging alone would shut out anyone without a
    // pointer, and so would a tap-only toolbar.
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Enter']) {
      expect(source, key).toMatch(new RegExp(`\\b${key}\\b`));
    }
    expect(source).toMatch(/tabIndex=\{0\}/);
  });
});
