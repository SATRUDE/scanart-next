'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import {
  calculateGalleryWall,
  formatCentimetres,
  alignFromDrag,
  movePrintTo,
  PRINT_SIZES,
  type PrintAlign,
  type PrintSizeKey,
  type WallPrint,
} from '@/lib/gallery-wall-calculator';

const DEFAULTS = { wallWidth: 240, wallHeight: '', gap: 6 };

/**
 * useLayoutEffect on the client, useEffect on the server render.
 *
 * The reflow below MUST be measured and inverted before the browser paints,
 * or the wall visibly jumps one frame before it glides. React warns about
 * useLayoutEffect during prerender, hence the swap.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * A print carries a stable id.
 *
 * The wall now RE-RENDERS as you drag - it shows the arrangement you will get,
 * not an approximation of it - so prints change row and index mid-gesture.
 * Identity has to survive that: it is what the drag holds on to, and what the
 * reflow animation matches old positions to new ones by.
 */
type Print = WallPrint & { id: string };

let nextPrintId = 0;
const centred = (size: PrintSizeKey): Print => ({ id: `print-${nextPrintId++}`, size, align: 'centre' });

/** A real wall rarely repeats one size, and rarely sits in one line. */
const DEFAULT_ROWS: Print[][] = [
  [centred('50x70'), centred('50x50'), centred('50x70')],
  [centred('50x50'), centred('50x50')],
];

const ALIGNMENTS: { value: PrintAlign; label: string; glyph: string }[] = [
  { value: 'top', label: 'Align its top edge with the row', glyph: '⌃' },
  { value: 'centre', label: 'Centre it in the row', glyph: '–' },
  { value: 'bottom', label: 'Align its bottom edge with the row', glyph: '⌄' },
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
  const [rows, setRows] = useState<Print[][]>(DEFAULT_ROWS);
  const [gapInput, setGapInput] = useState(String(DEFAULTS.gap));

  /**
   * A drag in flight.
   *
   * `from` and `over` are both positions in the COMMITTED rows, which is what
   * movePrintTo takes. The wall is rendered from that move applied, so what
   * you see while dragging is the arrangement you will get: releasing commits
   * the same rows the screen is already showing and moves nothing.
   *
   * The print you are holding is drawn twice - a faded placeholder in the slot
   * it will occupy, and a copy pinned to the pointer - because those are two
   * different questions ("where will this land" and "what am I holding") and
   * one element cannot answer both.
   */
  const [drag, setDrag] = useState<{
    id: string;
    from: Position;
    over: Position;
    /** Which of the three places in the row the print will land on. */
    align: PrintAlign;
    /** Centimetres of wall per pixel of preview, so vertical drag can be read
     *  in the units the wall is measured in. */
    cmPerPx: number;
    /** Live pointer position, and where in the print it was grabbed. */
    pointer: { x: number; y: number };
    grab: { x: number; y: number };
    size: { width: number; height: number };
  } | null>(null);

  const wallRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  /**
   * Whether a drag is live, as a ref. The move handler cannot gate on the
   * `drag` state: pointerdown sets it asynchronously, so the first pointermove
   * of every drag arrives before the state exists and would be thrown away.
   */
  const draggingRef = useRef(false);
  /** The id of the print being held, for the reflow to leave alone. */
  const heldRef = useRef<string | null>(null);
  /**
   * What the move handler needs synchronously. pointerdown sets state
   * asynchronously, so the first pointermove of every drag arrives before
   * `drag` exists and would otherwise be thrown away.
   */
  const dragInfoRef = useRef<{ id: string; from: Position; cmPerPx: number } | null>(null);
  /** The last target read, so a row made by this drag does not erase it. */
  const overRef = useRef<Position>({ row: 0, index: 0 });
  /** Each print's last laid-out position, by id, for the reflow animation. */
  const layoutRef = useRef(new Map<string, { x: number; y: number }>());
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

  /**
   * The arrangement as it will be when the drag is released - the move already
   * applied, the alignment already set.
   *
   * This, not the committed rows, is what gets rendered and measured. The old
   * version left the wall untouched during a drag and slid the other prints
   * aside with transforms, which could only ever approximate the real thing:
   * the true layout also re-centres every row and can change a row's height,
   * so releasing snapped the wall into a different arrangement than the one
   * you were looking at. Previewing the genuine result is the only way the
   * drop can be a no-op.
   */
  const displayRows: readonly Print[][] = (() => {
    if (!drag) return safeRows;
    const withAlign = safeRows.map((row, ri) =>
      row.map((print, i) => (ri === drag.from.row && i === drag.from.index ? { ...print, align: drag.align } : print))
    );
    const samePlace = drag.from.row === drag.over.row && drag.from.index === drag.over.index;
    return samePlace ? withAlign : movePrintTo(withAlign, drag.from, drag.over);
  })();

  const result = calculateGalleryWall({
    wallWidth: safeWallWidth,
    wallHeight: isValid ? wallHeight : undefined,
    rows: displayRows,
    gap: safeGap,
  });

  /**
   * THE REFLOW. Every print that moved because of the preview above is put
   * back where it was with a transform, then released to slide to where it
   * now belongs - measured from layout offsets, which transforms do not
   * affect, so a half-finished slide cannot poison the next measurement.
   *
   * The print being held is skipped: it is following the pointer.
   */
  useIsomorphicLayoutEffect(() => {
    const wall = wallRef.current;
    if (!wall) return;
    const nodes = [...wall.querySelectorAll<HTMLElement>('[data-print-id]')];
    const now = new Map(nodes.map(el => [el.dataset.printId ?? '', { x: el.offsetLeft, y: el.offsetTop }]));
    const previous = layoutRef.current;
    layoutRef.current = now;
    const frames: number[] = [];
    for (const el of nodes) {
      const printId = el.dataset.printId ?? '';
      if (printId === heldRef.current) continue;
      const was = previous.get(printId);
      const is = now.get(printId);
      if (!was || !is) continue;
      const dx = was.x - is.x;
      const dy = was.y - is.y;
      if (dx === 0 && dy === 0) continue;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      frames.push(requestAnimationFrame(() => {
        el.style.transition = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)';
        el.style.transform = '';
      }));
    }
    return () => frames.forEach(cancelAnimationFrame);
  }, [displayRows, safeGap, safeWallWidth]);

  const setSizeAt = (row: number, index: number, size: PrintSizeKey) =>
    setRows(current => current.map((r, ri) => (ri === row ? r.map((print, i) => (i === index ? { ...print, size } : print)) : r)));

  const setAlignAt = (row: number, index: number, align: PrintAlign) => {
    setRows(current => current.map((r, ri) => (ri === row ? r.map((print, i) => (i === index ? { ...print, align } : print)) : r)));
    setOrderMessage(align === 'centre' ? 'Print centred in its row.' : `Print aligned to the ${align} of its row.`);
  };

  const addPrint = () =>
    setRows(current => {
      if (printCount >= MAX_PRINTS) return current;
      const last = current.at(-1) ?? [];
      const like = last.at(-1)?.size ?? '50x70';
      return current.length
        ? current.map((r, ri) => (ri === current.length - 1 ? [...r, centred(like)] : r))
        : [[centred('50x70')]];
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

  const beginDrag = (row: number, index: number, print: Print, clientX: number, clientY: number, target: HTMLElement, pointerId: number) => {
    const wall = wallRef.current;
    if (!wall) return;
    const rect = target.getBoundingClientRect();
    // The scale, read off the print being dragged: its rendered height in
    // pixels against its real height in centimetres. Vertical work is then
    // done in centimetres, so the feel does not change with the preview size.
    const cmPerPx = rect.height > 0 ? PRINT_SIZES[print.size].height / rect.height : 1;
    dragStartRef.current = { x: clientX, y: clientY };
    dragInfoRef.current = { id: print.id, from: { row, index }, cmPerPx };
    overRef.current = { row, index };
    heldRef.current = print.id;
    // Captured on the WALL, not on the print. A print that changes row is
    // re-parented in the DOM, and re-parenting a node silently drops its
    // pointer capture - which would end the drag at the exact moment it
    // succeeded. The wall is there for the whole gesture.
    wall.setPointerCapture(pointerId);
    draggingRef.current = true;
    setDrag({
      id: print.id,
      from: { row, index },
      over: { row, index },
      align: print.align,
      cmPerPx,
      pointer: { x: clientX, y: clientY },
      grab: { x: clientX - rect.left, y: clientY - rect.top },
      size: { width: rect.width, height: rect.height },
    });
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const wall = wallRef.current;
    const info = dragInfoRef.current;
    if (!wall || !info) return;

    /**
     * Hit-test against the wall AS IT IS NOW, not as it was at pointerdown.
     *
     * The wall reflows under the pointer while you drag, so measurements taken
     * once at the start go stale the instant the first print moves aside - the
     * row you are aiming at is no longer where it was. Reading the live rows
     * each move is a handful of rect reads and it cannot drift.
     *
     * The print being held is excluded from its row's slots, which makes the
     * count of slots to the left of the pointer the insertion index that
     * movePrintTo wants: it splices the print out before putting it back.
     */
    const bands = [...wall.querySelectorAll<HTMLElement>('[data-wall-row]')].map(rowEl => {
      const rect = rowEl.getBoundingClientRect();
      const slots = [...rowEl.querySelectorAll<HTMLElement>('[data-print-id]')]
        .filter(el => el.dataset.printId !== info.id)
        .map(el => {
          const slot = el.getBoundingClientRect();
          return { id: el.dataset.printId ?? '', centre: slot.left + slot.width / 2 };
        })
        .sort((a, b) => a.centre - b.centre);
      return { top: rect.top, bottom: rect.bottom, slots };
    });
    if (!bands.length) return;

    const first = bands[0];
    const last = bands[bands.length - 1];
    // Clear of the wall by half a row is how a print asks for a row of its own.
    const margin = Math.max(12, ((last.bottom - first.top) / bands.length) * 0.5);

    let over: Position;
    if (clientY < first.top - margin) {
      over = { row: -1, index: 0 };
    } else if (clientY > last.bottom + margin) {
      over = { row: safeRows.length, index: 0 };
    } else {
      let nearest = 0;
      let best = Infinity;
      bands.forEach((band, i) => {
        const gap = clientY < band.top ? band.top - clientY : clientY > band.bottom ? clientY - band.bottom : 0;
        if (gap < best) {
          best = gap;
          nearest = i;
        }
      });
      const band = bands[nearest];
      const anchor = band.slots[0]?.id;
      const committed = anchor ? safeRows.findIndex(row => row.some(print => print.id === anchor)) : -1;
      // A band with nothing in it but the print being dragged exists only
      // because this drag made it, so there is no new target to read from it.
      over = committed < 0
        ? overRef.current
        : { row: committed, index: band.slots.filter(slot => clientX > slot.centre).length };
    }
    overRef.current = over;

    const self = safeRows[info.from.row]?.[info.from.index];
    const align = !self
      ? 'centre'
      : over.row === info.from.row
        // Still in its own row: vertical drag picks one of the three places a
        // short print can hang in a taller row.
        ? alignFromDrag(self, result.rowHeights[info.from.row] ?? 0, (clientY - dragStartRef.current.y) * info.cmPerPx)
        : self.align;

    setDrag(current => (current ? { ...current, over, align, pointer: { x: clientX, y: clientY } } : current));
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    heldRef.current = null;
    dragInfoRef.current = null;
    const current = drag;
    setDrag(null);
    if (!current) return;

    const samePlace = current.from.row === current.over.row && current.from.index === current.over.index;
    const wasAlign = safeRows[current.from.row]?.[current.from.index]?.align;
    if (samePlace && wasAlign === current.align) return;

    // The wall is ALREADY showing this arrangement, so committing it is not a
    // move: it is the preview becoming permanent, and nothing on screen shifts.
    setRows(displayRows.map(row => [...row]));

    if (samePlace) {
      setOrderMessage(current.align === 'centre' ? 'Print centred in its row.' : `Print snapped to the ${current.align} of its row.`);
      return;
    }
    const landedRow = displayRows.findIndex(row => row.some(print => print.id === current.id));
    const landedIndex = displayRows[landedRow]?.findIndex(print => print.id === current.id) ?? 0;
    setOrderMessage(`Print moved to row ${landedRow + 1}, position ${landedIndex + 1}.`);
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

  const mixed = new Set(safeRows.flat().map(print => print.size)).size > 1;

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
        <p className="mt-1 text-xs text-neutral-600">{printCount} of {MAX_PRINTS} across {displayRows.length} {displayRows.length === 1 ? 'row' : 'rows'}. Drag them on the wall below, or move them here.</p>
        {/* The preview rows, not the committed ones. This list sits ABOVE the
            wall, so if it only gained a row on release it grew by a row's
            height at that moment and shoved the whole wall down - a drop that
            moved everything, which is the one thing this must never do. */}
        {displayRows.map((row, rowIndex) => (
          <div key={rowIndex} className="mt-3">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Row {rowIndex + 1}</p>
            <ul className="mt-1 flex flex-wrap gap-3">
              {row.map((print, index) => {
                const tallestInRow = result.rowHeights[rowIndex] ?? 0;
                const canAlign = PRINT_SIZES[print.size].height < tallestInRow;
                return (
                <li key={print.id} className="flex items-end gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2">
                  <label className="text-xs font-medium text-neutral-700" htmlFor={`${id}-print-${rowIndex}-${index}`}>
                    Print {index + 1}
                    <select id={`${id}-print-${rowIndex}-${index}`} value={print.size} onChange={event => setSizeAt(rowIndex, index, event.currentTarget.value as PrintSizeKey)} className="mt-1 block min-h-11 rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
                      {Object.entries(PRINT_SIZES).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
                    </select>
                  </label>
                  {/* Alignment only does something for a print SHORTER than
                      the tallest in its row, so the control says so rather
                      than offering three buttons that all look identical. */}
                  <span role="group" aria-label={`How print ${index + 1} hangs in row ${rowIndex + 1}`} className="flex flex-col gap-0.5">
                    {ALIGNMENTS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAlignAt(rowIndex, index, option.value)}
                        disabled={!canAlign}
                        aria-pressed={print.align === option.value}
                        title={canAlign ? option.label : 'This print is the tallest in its row, so it sets the line'}
                        className={`min-h-5 rounded border px-1.5 text-xs leading-none disabled:opacity-25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${print.align === option.value && canAlign ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'}`}
                      >
                        <span aria-hidden="true">{option.glyph}</span>
                        <span className="sr-only">{option.label}</span>
                      </button>
                    ))}
                  </span>
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
                );
              })}
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
            {displayRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                data-wall-row=""
                className="flex items-center justify-center"
                style={{ gap: `${Math.max(2, safeGap * 0.55)}px`, height: (result.rowHeights[rowIndex] ?? 70) === 70 ? '62px' : '46px' }}
              >
                {row.map((wallPrint, index) => {
                  const print = PRINT_SIZES[wallPrint.size];
                  const isHeld = drag?.id === wallPrint.id;
                  return (
                    <div
                      key={wallPrint.id}
                      data-print=""
                      data-print-id={wallPrint.id}
                      data-row={rowIndex}
                      data-index={index}
                      onPointerDown={event => {
                        if (event.button !== 0) return;
                        event.preventDefault();
                        beginDrag(rowIndex, index, wallPrint, event.clientX, event.clientY, event.currentTarget, event.pointerId);
                      }}
                      title={`Row ${rowIndex + 1}, print ${index + 1}, ${print.label}, ${wallPrint.align === 'centre' ? 'centred' : wallPrint.align + '-aligned'}. Drag to move.`}
                      // While held, this is the SLOT the print will land in,
                      // not the print: it is drawn as an outline, and the
                      // print itself is the copy under the pointer below.
                      className={`p-1 ${isHeld ? 'border-2 border-dashed border-neutral-400 bg-neutral-50' : 'cursor-grab border-2 border-neutral-800 bg-neutral-100'}`}
                      style={{
                        aspectRatio: `${print.width} / ${print.height}`,
                        height: print.height === 70 ? '62px' : '46px',
                        // The row is as tall as its tallest print; a shorter
                        // one hangs at the top, centre or bottom of that band.
                        alignSelf: wallPrint.align === 'top' ? 'flex-start' : wallPrint.align === 'bottom' ? 'flex-end' : 'center',
                        touchAction: 'none',
                      }}
                    >
                      {!isHeld && <div className="h-full w-full border border-neutral-300" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* The print under the pointer. Pinned to the viewport rather than
            laid out, so the reflowing wall cannot drag it about, and ignoring
            pointer events so it never hit-tests itself. */}
        {drag && (
          <div
            className="pointer-events-none fixed z-50 border-2 border-neutral-900 bg-neutral-100 p-1 shadow-lg"
            style={{
              left: `${drag.pointer.x - drag.grab.x}px`,
              top: `${drag.pointer.y - drag.grab.y}px`,
              width: `${drag.size.width}px`,
              height: `${drag.size.height}px`,
              transform: 'scale(1.06)',
            }}
          >
            <div className="h-full w-full border border-neutral-300" />
          </div>
        )}
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
