import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dropping a print must not move anything.
 *
 * The first version of this drag left the wall untouched while you dragged and
 * slid the other prints aside with transforms, then reordered for real on
 * release. That could only ever approximate the result: the true layout also
 * re-centres each row and can change a row's height, so releasing snapped the
 * wall into an arrangement different from the one under your finger. It was
 * reported as the drag being broken, twice, in different words.
 *
 * The fix is structural rather than a tuned constant: the wall RENDERS the
 * previewed rows, and the drop commits exactly those. So the guard is
 * structural too. These read the source because the property lives in which
 * value gets rendered and committed, and a jsdom drag cannot see it - jsdom
 * has no layout, so every offset it reports is zero and a wall that reflowed
 * wrongly would pass.
 */
describe('gallery wall drag commits what it previews', () => {
  const source = readFileSync(join(process.cwd(), 'components/GalleryWallCalculator.tsx'), 'utf8');
  const between = (start: string, end: string) => source.slice(source.indexOf(start), source.indexOf(end));

  it('commits the previewed rows on release, and nothing else', () => {
    expect(source).toMatch(/setRows\(displayRows\.map\(row => \[\.\.\.row\]\)\)/);
    // A second, independently computed move on release is the old bug: it can
    // disagree with the preview, and did.
    expect(between('const onWallPointerUp', 'useEffect(() => () =>')).not.toMatch(/movePrintTo/);
  });

  it('measures and draws the wall from the previewed rows', () => {
    // The figures, the drawing and the hanging plan all project from one
    // layout, and that layout is computed from displayRows. Nothing else on
    // the page reads `rows` for geometry.
    expect(source).toMatch(/rows: displayRows, gap: safeGap \}/);
    expect(source).toMatch(/const layout = layoutGalleryWall\(inputs, safeCentre\)/);
    expect(source).toMatch(/layout\.prints\.map\(placed =>/);
    expect(source).not.toMatch(/layoutGalleryWall\(\{[^}]*rows: rows/);
  });

  it('positions prints from the model rather than faking a reflow with transforms', () => {
    // One measured "step" cannot express a row re-centring, which is what
    // made the preview and the result disagree.
    expect(source).not.toMatch(/shiftFor/);
    expect(source).not.toMatch(/translateX\(\$\{shift\}px\)/);
    expect(source).toMatch(/left: x\(placed\.left\)/);
    expect(source).toMatch(/top: y\(placed\.topFromFloor\)/);
  });

  it('hit-tests the model, not the DOM, so a sliding neighbour cannot flip the target', () => {
    const inMove = between('const onWallPointerMove', 'const onWallPointerUp');
    expect(inMove).toMatch(/layout\.rowTops\.map/);
    expect(inMove).toMatch(/layout\.prints/);
    // The only rect read is the wall's own, for projection.
    expect(inMove.match(/getBoundingClientRect\(\)/g)?.length).toBe(1);
    expect(inMove).toMatch(/wall\.getBoundingClientRect\(\)/);
  });

  it('captures the pointer on the wall, not on the print', () => {
    // A print that changes row is re-parented, and re-parenting a node drops
    // its pointer capture - ending the drag at the moment it succeeded.
    expect(source).toMatch(/wallRef\.current\?\.setPointerCapture\(event\.pointerId\)/);
    expect(source).not.toMatch(/currentTarget\.setPointerCapture/);
  });

  it('keeps every print identifiable across a reflow', () => {
    // Row and index both change mid-gesture, so neither can identify a print.
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
