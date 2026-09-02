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

  it('commits the previewed rows on release, and nothing else', () => {
    expect(source).toMatch(/setRows\(displayRows\.map\(row => \[\.\.\.row\]\)\)/);
    // A second, independently computed move on release is the old bug: it can
    // disagree with the preview, and did.
    const inEndDrag = source.slice(source.indexOf('const endDrag'), source.indexOf('const widest'));
    expect(inEndDrag).not.toMatch(/movePrintTo/);
  });

  it('measures and renders the wall from the previewed rows', () => {
    // The figures, the wall, and the form list must all read the same rows.
    // The form list sits ABOVE the wall: if it alone gained a row on release
    // it grew by a row's height at that moment and shoved the wall down.
    expect(source).toMatch(/rows: displayRows,/);
    const renders = source.match(/displayRows\.map\(\(row, rowIndex\) => \(/g) ?? [];
    expect(renders.length, 'both the form list and the wall render displayRows').toBe(2);
  });

  it('does not fake the reflow with a uniform slot shift', () => {
    // One measured "step" cannot express a row re-centring, which is what made
    // the preview and the result disagree.
    expect(source).not.toMatch(/shiftFor/);
    expect(source).not.toMatch(/translateX\(\$\{shift\}px\)/);
  });

  it('hit-tests the wall as it is now, not as it was at pointerdown', () => {
    // The wall reflows under the pointer, so geometry cached at pointerdown
    // goes stale the instant the first print moves aside.
    expect(source).toMatch(/data-wall-row/);
    const inMoveDrag = source.slice(source.indexOf('const moveDrag'), source.indexOf('const endDrag'));
    expect(inMoveDrag).toMatch(/querySelectorAll<HTMLElement>\('\[data-wall-row\]'\)/);
  });

  it('captures the pointer on the wall, not on the print', () => {
    // A print that changes row is re-parented, and re-parenting a node drops
    // its pointer capture - ending the drag at the moment it succeeded.
    expect(source).toMatch(/wall\.setPointerCapture\(pointerId\)/);
    expect(source).not.toMatch(/target\.setPointerCapture/);
  });

  it('keeps every print identifiable across a reflow', () => {
    // Row and index both change mid-gesture, so neither can identify a print.
    expect(source).toMatch(/data-print-id=\{wallPrint\.id\}/);
    expect(source).toMatch(/key=\{wallPrint\.id\}/);
  });
});
