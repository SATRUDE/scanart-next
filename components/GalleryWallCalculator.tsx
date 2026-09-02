'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import {
  calculateGalleryWall,
  formatCentimetres,
  movePrintTo,
  PRINT_SIZES,
  type PrintSizeKey,
} from '@/lib/gallery-wall-calculator';

const DEFAULTS = { wallWidth: 240, wallHeight: '', gap: 6 };

/** A real wall rarely repeats one size, and rarely sits in one line. */
const DEFAULT_ROWS: PrintSizeKey[][] = [
  ['50x70', '50x50', '50x70'],
  ['50x50', '50x50'],
];

const MAX_PRINTS = 12;

/** Where a print is, and where a drag would put it. */
type Position = { row: number; index: number };

/**
 * `locale` follows LandingCrossLinks: the component carries its own prefix so
 * a literal English path cannot leak on a Norwegian render. There is no
 * Norwegian article route today, so this changes nothing yet - but
 * lib/i18n-no.test.ts sweeps EVERY component rather than a hand-picked list,
 * deliberately, because where a component is mounted is not visible from the
 * guard and "article-only" is one page away from being untrue.
 */
export function GalleryWallCalculator({ locale = 'en' }: { locale?: 'en' | 'no' } = {}) {
  const localePrefix = locale === 'no' ? '/no' : '';
  const id = useId();
  const [wallWidthInput, setWallWidthInput] = useState(String(DEFAULTS.wallWidth));
  const [wallHeightInput, setWallHeightInput] = useState(DEFAULTS.wallHeight);
  const [rows, setRows] = useState<PrintSizeKey[][]>(DEFAULT_ROWS);
  const [gapInput, setGapInput] = useState(String(DEFAULTS.gap));

  /**
   * A drag in flight. `from` is where the print started, `over` is where it
   * would land, `dx`/`dy` are how far the pointer has travelled.
   *
   * The wall is deliberately NOT reordered while dragging. The dragged print
   * follows the pointer and every other print is TRANSFORMED aside, so a gap
   * opens where it will go and the wall glides. It is committed once, on
   * release.
   */
  const [drag, setDrag] = useState<{
    from: Position;
    over: Position;
    dx: number;
    dy: number;
    /** One slot's width, measured at pointerdown and carried in STATE rather
     *  than read from a ref during render, which react-hooks/refs rightly
     *  refuses: a ref read while rendering can be a frame stale, and on a drag
     *  that is exactly when it shows. */
    step: number;
  } | null>(null);

  /**
   * True for the one frame in which a drop commits.
   *
   * On release the wall reorders AND the transforms clear, and those cancel
   * out, so the correct amount of visible movement is none. With the
   * transition armed the browser animates it anyway, which reads as the wall
   * springing back and then re-sorting itself.
   */
  const [settling, setSettling] = useState(false);

  const wallRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  /**
   * Whether a drag is live, as a ref. The move handler cannot gate on the
   * `drag` state: pointerdown sets it asynchronously, so the first pointermove
   * of every drag arrives before the state exists and would be thrown away.
   */
  const draggingRef = useRef(false);
  /** Every slot's centre, measured once at pointerdown, before anything moves. */
  const geometryRef = useRef<{ row: number; index: number; x: number; y: number }[]>([]);
  const [orderMessage, setOrderMessage] = useState('');

  const wallWidth = Number(wallWidthInput);
  const wallHeight = wallHeightInput === '' ? undefined : Number(wallHeightInput);
  const gap = Number(gapInput);
  const printCount = rows.reduce((count, row) => count + row.length, 0);

  const wallError = wallWidthInput === '' ? 'Enter your wall width.' : wallWidth <= 0 ? 'Use a wall width greater than 0 cm.' : '';
  const heightError = wallHeightInput !== '' && (!Number.isFinite(wallHeight) || (wallHeight ?? 0) <= 0) ? 'Use a wall height greater than 0 cm, or leave it blank.' : '';
  const printsError = printCount === 0 ? 'Add at least one print.' : '';
  const gapError = gapInput === '' ? 'Enter the gap you’d like between the frames.' : gap < 0 ? 'The gap can’t be less than 0 cm.' : '';
  const isValid = !wallError && !heightError && !printsError && !gapError && Number.isFinite(wallWidth) && Number.isFinite(gap);

  const safeWallWidth = isValid ? wallWidth : DEFAULTS.wallWidth;
  const safeGap = isValid ? gap : DEFAULTS.gap;
  const safeRows = printCount ? rows : DEFAULT_ROWS;
  const result = calculateGalleryWall({
    wallWidth: safeWallWidth,
    wallHeight: isValid ? wallHeight : undefined,
    rows: safeRows,
    gap: safeGap,
  });

  useEffect(() => {
    if (!settling) return;
    const frame = requestAnimationFrame(() => setSettling(false));
    return () => cancelAnimationFrame(frame);
  }, [settling]);

  const setPrintAt = (row: number, index: number, size: PrintSizeKey) =>
    setRows(current => current.map((r, ri) => (ri === row ? r.map((s, i) => (i === index ? size : s)) : r)));

  const addPrint = () =>
    setRows(current => {
      if (printCount >= MAX_PRINTS) return current;
      const last = current.at(-1) ?? [];
      return current.length
        ? current.map((r, ri) => (ri === current.length - 1 ? [...r, last.at(-1) ?? '50x70'] : r))
        : [['50x70']];
    });

  const removeAt = (row: number, index: number) =>
    setRows(current =>
      current.map((r, ri) => (ri === row ? r.filter((_, i) => i !== index) : r)).filter(r => r.length)
    );

  /** The button path: one move, announced. */
  const move = (from: Position, to: Position) => {
    setRows(current => {
      const next = movePrintTo(current, from, to);
      setOrderMessage(`Print moved to row ${Math.max(1, Math.min(to.row + 1, next.length))}, position ${to.index + 1}.`);
      return next;
    });
  };

  const beginDrag = (row: number, index: number, clientX: number, clientY: number, target: HTMLElement, pointerId: number) => {
    const wall = wallRef.current;
    if (!wall) return;
    // Measure every print's centre once, before any transform is applied.
    geometryRef.current = [...wall.querySelectorAll('[data-print]')].map(node => {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      return {
        row: Number(el.dataset.row),
        index: Number(el.dataset.index),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    });
    const here = geometryRef.current.filter(g => g.row === row).sort((a, b) => a.x - b.x);
    const step = here.length > 1 ? here[1].x - here[0].x : 60;
    dragStartRef.current = { x: clientX, y: clientY };
    target.setPointerCapture(pointerId);
    draggingRef.current = true;
    setDrag({ from: { row, index }, over: { row, index }, dx: 0, dy: 0, step });
  };

  const moveDrag = (clientX: number, clientY: number) => {
    setDrag(current => {
      if (!current) return current;
      const geometry = geometryRef.current;
      const origin = geometry.find(g => g.row === current.from.row && g.index === current.from.index);
      if (!origin) return current;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const centreX = origin.x + dx;
      const centreY = origin.y + dy;

      // Which band is the print over? The row whose centre line is nearest,
      // unless it has been dragged clear above the first or below the last,
      // which is how a print gets a row of its own.
      const rowCentres = safeRows.map((_, ri) => {
        const inRow = geometry.filter(g => g.row === ri);
        return inRow.length ? inRow.reduce((sum, g) => sum + g.y, 0) / inRow.length : 0;
      });
      let over: Position;
      const firstRowTop = rowCentres[0] ?? 0;
      const lastRowBottom = rowCentres.at(-1) ?? 0;
      const bandHeight = current.step; // near enough: slots are square-ish
      if (centreY < firstRowTop - bandHeight) {
        over = { row: -1, index: 0 };
      } else if (centreY > lastRowBottom + bandHeight) {
        over = { row: safeRows.length, index: 0 };
      } else {
        let nearest = 0;
        rowCentres.forEach((y, ri) => {
          if (Math.abs(centreY - y) < Math.abs(centreY - rowCentres[nearest])) nearest = ri;
        });
        const inRow = geometry.filter(g => g.row === nearest).sort((a, b) => a.x - b.x);
        let index = inRow.filter(g => centreX > g.x).length;
        // Moving within its own row, the print's own slot does not count twice.
        if (nearest === current.from.row && index > current.from.index) index -= 1;
        over = { row: nearest, index };
      }
      return { ...current, dx, dy, over };
    });
  };

  const endDrag = () => {
    draggingRef.current = false;
    if (!drag) return;
    const { from, over } = drag;
    const same = from.row === over.row && from.index === over.index;
    if (!same) setSettling(true);
    setDrag(null);
    if (same) return;
    setRows(prev => movePrintTo(prev, from, over));
    setOrderMessage(
      over.row === -1 ? 'Print moved to a new row above.'
      : over.row >= rows.length ? 'Print moved to a new row below.'
      : `Print moved to row ${over.row + 1}, position ${over.index + 1}.`
    );
  };

  /**
   * How far a print that is not being dragged must slide to make room.
   *
   * Only prints in the row being dropped into move, and only sideways: a
   * vertical reflow of whole bands while dragging reads as the wall jumping
   * about, which is the opposite of what this is for.
   */
  const shiftFor = (row: number, index: number) => {
    if (!drag) return 0;
    const { from, over, step } = drag;
    if (row === from.row && index === from.index) return 0;
    if (over.row !== row) {
      // Leaving this row: everything after the gap closes up.
      if (row === from.row && index > from.index) return -step;
      return 0;
    }
    if (row === from.row) {
      if (from.index < over.index && index > from.index && index <= over.index) return -step;
      if (from.index > over.index && index >= over.index && index < from.index) return step;
      return 0;
    }
    // Arriving from another row: make a hole at the insertion point.
    return index >= over.index ? step : 0;
  };

  const widest = Math.max(result.totalWidth, safeWallWidth);
  const statusCopy = {
    fit: 'That fits comfortably. The prints should read as one group, with enough room around them.',
    tight: 'It fits, but only just. Check nearby furniture, switches and corners before you hang.',
    exact: 'It fits exactly, with no space left at either side. Give it a little breathing room before reaching for the drill.',
    'no-fit': result.fitsHeight === false
      ? `This wall is ${formatCentimetres(result.heightOverflow)} taller than the space. Move a print up into another row, or drop one.`
      : `This arrangement is ${formatCentimetres(result.overflow)} wider than the wall. Move a print to another row, or reduce the gap.`,
  }[result.fitStatus];

  const liveCopy = result.fitStatus !== 'fit'
    ? statusCopy
    : result.gapStatus === 'tight'
      ? 'It fits, but the frames may feel cramped. Try a gap of 5 to 8 cm if the wall allows.'
      : result.gapStatus === 'wide'
        ? 'It fits, but the frames may start to feel separate. Bring the gap back to 5 to 8 cm.'
        : statusCopy;

  const mixed = new Set(safeRows.flat()).size > 1;

  return (
    <section className="not-prose my-10 scroll-mt-20 border-y border-neutral-300 py-7" aria-labelledby={`${id}-title`}>
      <div className="mb-6 max-w-2xl">
        <h3 id={`${id}-title`} className="text-2xl font-medium text-neutral-900">Gallery wall spacing calculator</h3>
        <p className="mt-2 leading-relaxed text-neutral-700">Set a size for each print, then drag them around the wall — sideways, or up and down into another row. Mixing sizes and rows is what stops a wall looking like a shop display.</p>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-3">
        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-wall`}>
          Wall width <span className="font-normal text-neutral-600">(cm)</span>
          <input id={`${id}-wall`} type="number" inputMode="decimal" min="1" max="1200" step="1" value={wallWidthInput} aria-invalid={Boolean(wallError)} aria-describedby={`${id}-wall-help${wallError ? ` ${id}-wall-error` : ''}`} onChange={event => setWallWidthInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-wall-help`} className="mt-1 block text-xs font-normal text-neutral-600">Measure the usable wall space, not the whole room.</span>
          {wallError && <span id={`${id}-wall-error`} className="mt-1 block text-xs font-normal text-destructive">{wallError}</span>}
        </label>

        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-height`}>
          Wall height <span className="font-normal text-neutral-600">(cm, optional)</span>
          <input id={`${id}-height`} type="number" inputMode="decimal" min="1" max="600" step="1" value={wallHeightInput} placeholder="—" aria-invalid={Boolean(heightError)} aria-describedby={`${id}-height-help${heightError ? ` ${id}-height-error` : ''}`} onChange={event => setWallHeightInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-height-help`} className="mt-1 block text-xs font-normal text-neutral-600">Only needed once you stack rows. Leave blank and height is not checked.</span>
          {heightError && <span id={`${id}-height-error`} className="mt-1 block text-xs font-normal text-destructive">{heightError}</span>}
        </label>

        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-gap`}>
          Gap <span className="font-normal text-neutral-600">(cm)</span>
          <input id={`${id}-gap`} type="number" inputMode="decimal" min="0" max="30" step="0.5" value={gapInput} aria-invalid={Boolean(gapError)} aria-describedby={`${id}-gap-help${gapError ? ` ${id}-gap-error` : ''}`} onChange={event => setGapInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-gap-help`} className="mt-1 block text-xs font-normal text-neutral-600">5 to 8 cm, between prints and between rows.</span>
          {gapError && <span id={`${id}-gap-error`} className="mt-1 block text-xs font-normal text-destructive">{gapError}</span>}
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-neutral-800">Your prints</legend>
        <p className="mt-1 text-xs text-neutral-600">{printCount} of {MAX_PRINTS} across {safeRows.length} {safeRows.length === 1 ? 'row' : 'rows'}. Drag them on the wall below, or move them here.</p>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="mt-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Row {rowIndex + 1}</p>
            <ul className="mt-1 flex flex-wrap gap-3">
              {row.map((size, index) => (
                <li key={index} className="flex items-end gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
                  <label className="text-xs font-medium text-neutral-700" htmlFor={`${id}-print-${rowIndex}-${index}`}>
                    Print {index + 1}
                    <select id={`${id}-print-${rowIndex}-${index}`} value={size} onChange={event => setPrintAt(rowIndex, index, event.currentTarget.value as PrintSizeKey)} className="mt-1 block min-h-11 rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
                      {Object.entries(PRINT_SIZES).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
                    </select>
                  </label>
                  {/* Dragging alone would shut out anyone on a keyboard, and
                      these also cover moving between rows without a pointer.
                      WCAG 2.1.1 and 2.5.7. */}
                  <span className="grid grid-cols-2 gap-0.5">
                    <button type="button" onClick={() => move({ row: rowIndex, index }, { row: rowIndex, index: index - 1 })} disabled={index === 0} className="min-h-5 rounded border border-neutral-300 px-1.5 text-xs leading-none text-neutral-700 hover:border-neutral-900 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      <span aria-hidden="true">←</span><span className="sr-only">Move left</span>
                    </button>
                    <button type="button" onClick={() => move({ row: rowIndex, index }, { row: rowIndex, index: index + 1 })} disabled={index === row.length - 1} className="min-h-5 rounded border border-neutral-300 px-1.5 text-xs leading-none text-neutral-700 hover:border-neutral-900 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      <span aria-hidden="true">→</span><span className="sr-only">Move right</span>
                    </button>
                    <button type="button" onClick={() => move({ row: rowIndex, index }, { row: rowIndex - 1, index: 0 })} className="min-h-5 rounded border border-neutral-300 px-1.5 text-xs leading-none text-neutral-700 hover:border-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      <span aria-hidden="true">↑</span><span className="sr-only">Move to the row above</span>
                    </button>
                    <button type="button" onClick={() => move({ row: rowIndex, index }, { row: rowIndex + 1, index: 0 })} className="min-h-5 rounded border border-neutral-300 px-1.5 text-xs leading-none text-neutral-700 hover:border-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      <span aria-hidden="true">↓</span><span className="sr-only">Move to the row below</span>
                    </button>
                  </span>
                  <button type="button" onClick={() => removeAt(rowIndex, index)} disabled={printCount <= 1} className="min-h-11 rounded-md border border-neutral-300 px-2 text-xs text-neutral-700 hover:border-neutral-900 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button type="button" onClick={addPrint} disabled={printCount >= MAX_PRINTS} className="mt-3 min-h-11 rounded-md border border-neutral-900 px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Add a print
        </button>
        {printsError && <p className="mt-1 text-xs text-destructive">{printsError}</p>}
      </fieldset>

      <div className="mt-7">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">Wall preview <span className="normal-case tracking-normal text-neutral-500">— drag a print anywhere, including into a new row</span></p>
        {/* The preview is where the wall is arranged, so it is the drag
            surface: you move the picture, not a form row. It stays aria-hidden
            because it is a second representation of the list the fieldset
            above already announces, and every move it offers is available
            there through labelled buttons. Nothing here is focusable. */}
        <div className="overflow-hidden border border-neutral-300 p-4 sm:p-6" aria-hidden="true">
          <div
            ref={wallRef}
            onPointerMove={event => { if (draggingRef.current) moveDrag(event.clientX, event.clientY); }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="mx-auto flex flex-col items-center justify-center border-x border-b border-neutral-300 py-3"
            style={{ width: `${Math.min(100, (safeWallWidth / widest) * 100)}%`, gap: `${Math.max(3, safeGap * 0.6)}px`, minHeight: '150px' }}
          >
            {safeRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center" style={{ gap: `${Math.max(2, safeGap * 0.55)}px` }}>
                {row.map((key, index) => {
                  const print = PRINT_SIZES[key];
                  const isDragging = drag?.from.row === rowIndex && drag?.from.index === index;
                  const shift = shiftFor(rowIndex, index);
                  return (
                    <div
                      key={index}
                      data-print=""
                      data-row={rowIndex}
                      data-index={index}
                      onPointerDown={event => {
                        if (event.button !== 0) return;
                        event.preventDefault();
                        beginDrag(rowIndex, index, event.clientX, event.clientY, event.currentTarget, event.pointerId);
                      }}
                      title={`Row ${rowIndex + 1}, print ${index + 1}, ${print.label}. Drag to move.`}
                      className={`border-2 bg-neutral-100 p-1 ${isDragging ? 'z-10 cursor-grabbing border-neutral-900 shadow-lg' : 'cursor-grab border-neutral-800'}`}
                      style={{
                        aspectRatio: `${print.width} / ${print.height}`,
                        height: print.height === 70 ? '62px' : '46px',
                        // The dragged print tracks the pointer with no
                        // transition, or it would lag behind the finger.
                        // Everything else eases, which is the whole feel.
                        transform: isDragging
                          ? `translate(${drag?.dx ?? 0}px, ${drag?.dy ?? 0}px) scale(1.06)`
                          : `translateX(${shift}px)`,
                        transition: isDragging || settling ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
                        touchAction: 'none',
                      }}
                    >
                      <div className="h-full w-full border border-neutral-300" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <h4 className="mt-6 text-lg font-medium text-neutral-900">Your arrangement</h4>
      <div className="mt-2 grid grid-cols-2 border-y border-neutral-300 sm:grid-cols-4 sm:divide-x sm:divide-neutral-300">
        <div className="py-4 sm:pr-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Widest row</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(result.totalWidth) : '—'}</strong></div>
        <div className="py-4 sm:px-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Whole wall, top to bottom</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(result.totalHeight) : '—'}</strong></div>
        <div className="border-t border-neutral-300 py-4 sm:border-t-0 sm:px-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Space at each side</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{!isValid ? '—' : result.overflow > 0 ? 'Does not fit' : formatCentimetres(result.sideMargin)}</strong></div>
        <div className="border-t border-neutral-300 py-4 sm:border-t-0 sm:pl-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Gap</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(gap) : '—'}</strong></div>
      </div>

      <div className="mt-5 text-sm leading-relaxed text-neutral-800" role="status" aria-live="polite" aria-atomic="true">
        <p className="font-medium">{isValid ? liveCopy : 'Complete the fields above to see your arrangement.'}</p>
        {orderMessage && <p className="mt-1 font-normal text-neutral-700">{orderMessage}</p>}
        {isValid && mixed && <p className="mt-1 font-normal text-neutral-700">With sizes mixed, hang each row on a shared centre line rather than a shared top edge, or it will look accidental.</p>}
      </div>

      <p className="mt-5 text-sm text-neutral-700">This is a planning guide based on print dimensions. Frames add a little width, so measure their outside edges before fixing any hooks.</p>
      <p className="mt-5 text-sm text-neutral-700">Now find the pieces that will make the wall worth hanging.</p>
      <TrackedLink event="gallery-wall-calculator-products-click" eventData={{ article: 'create-an-art-wall' }} href={`${localePrefix}/products`} className="mt-2 inline-flex min-h-11 items-center border-b border-neutral-900 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Browse the print collection <span aria-hidden="true" className="ml-1">→</span></TrackedLink>
    </section>
  );
}
