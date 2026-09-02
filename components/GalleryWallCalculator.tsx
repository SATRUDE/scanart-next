'use client';

import { useId, useRef, useState } from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import {
  calculateGalleryWall,
  formatCentimetres,
  movePrint,
  PRINT_SIZES,
  type PrintSizeKey,
} from '@/lib/gallery-wall-calculator';

const DEFAULTS = { wallWidth: 240, gap: 6 };

/** A real wall rarely repeats one size, so the default already mixes two. */
const DEFAULT_PRINTS: PrintSizeKey[] = ['50x70', '50x50', '50x70'];

const MAX_PRINTS = 12;

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
  const [prints, setPrints] = useState<PrintSizeKey[]>(DEFAULT_PRINTS);
  const [gapInput, setGapInput] = useState(String(DEFAULTS.gap));
  /**
   * A drag in progress. `from` is where the print started, `over` is the slot
   * it would land in, `dx` is how far the pointer has travelled.
   *
   * The array is deliberately NOT reordered while dragging. Reordering on
   * every crossing made the row jump a slot at a time, which is the thing
   * Mark did not want. Instead the dragged print follows the pointer and the
   * others are TRANSFORMED aside, so a gap opens where it will go and
   * everything glides. The array is committed once, on release.
   */
  const [drag, setDrag] = useState<{
    from: number;
    over: number;
    dx: number;
    /**
     * One slot's width, measured at pointerdown and carried in STATE rather
     * than read from the ref during render. eslint's react-hooks/refs is right
     * to refuse the latter: a ref read while rendering does not trigger a
     * re-render and can be a frame stale, which on a drag is exactly when it
     * would show.
     */
    step: number;
  } | null>(null);
  /**
   * Pointer events, not HTML5 drag. Native drag gives no usable pointer
   * position mid-drag, no control over the drag image, and nothing at all on
   * touch. Pointer events give all three and one code path for mouse, pen and
   * finger.
   */
  const rowRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef(0);
  /** Slot centres measured at pointerdown, so the maths does not re-read the
   *  DOM on every move (and cannot be confused by the transforms it applies). */
  const centresRef = useRef<number[]>([]);
  /**
   * What just happened to the order, announced separately from the fit copy.
   * A reorder is silent to a screen reader otherwise: the row rearranges and
   * nothing says so.
   */
  const [orderMessage, setOrderMessage] = useState('');

  const wallWidth = Number(wallWidthInput);
  const gap = Number(gapInput);
  const wallError = wallWidthInput === '' ? 'Enter your wall width.' : wallWidth <= 0 ? 'Use a wall width greater than 0 cm.' : '';
  const printsError = prints.length === 0 ? 'Add at least one print.' : '';
  const gapError = gapInput === '' ? 'Enter the gap you’d like between the frames.' : gap < 0 ? 'The gap can’t be less than 0 cm.' : '';
  const isValid = !wallError && !printsError && !gapError && Number.isFinite(wallWidth) && Number.isFinite(gap);
  const safeWallWidth = isValid ? wallWidth : DEFAULTS.wallWidth;
  const safeGap = isValid ? gap : DEFAULTS.gap;
  const safePrints = prints.length ? prints : DEFAULT_PRINTS;

  const result = calculateGalleryWall({ wallWidth: safeWallWidth, prints: safePrints, gap: safeGap });

  const setPrintAt = (index: number, size: PrintSizeKey) =>
    setPrints(current => current.map((existing, i) => (i === index ? size : existing)));
  const addPrint = () =>
    setPrints(current => (current.length >= MAX_PRINTS ? current : [...current, current.at(-1) ?? '50x70']));
  const removePrintAt = (index: number) =>
    setPrints(current => current.filter((_, i) => i !== index));

  /** The button path: move once and say so. */
  const reorder = (from: number, to: number) => {
    setPrints(current => {
      if (to < 0 || to >= current.length || to === from) return current;
      setOrderMessage(`Print ${from + 1} moved to position ${to + 1} of ${current.length}.`);
      return movePrint(current, from, to);
    });
  };

  const beginDrag = (index: number, clientX: number, target: HTMLElement, pointerId: number) => {
    const row = rowRef.current;
    if (!row) return;
    // Measure every slot's centre once, before anything moves.
    centresRef.current = [...row.children].map(child => {
      const rect = (child as HTMLElement).getBoundingClientRect();
      return rect.left + rect.width / 2;
    });
    dragStartXRef.current = clientX;
    target.setPointerCapture(pointerId);
    const centres = centresRef.current;
    const step = centres.length > 1 ? centres[1] - centres[0] : 0;
    setDrag({ from: index, over: index, dx: 0, step });
  };

  const moveDrag = (clientX: number) => {
    setDrag(current => {
      if (!current) return current;
      const dx = clientX - dragStartXRef.current;
      const centres = centresRef.current;
      // Where the dragged print's own centre now is, and therefore which slot
      // it belongs in: the count of slots whose centre it has passed.
      const centre = (centres[current.from] ?? 0) + dx;
      let over = 0;
      for (let i = 0; i < centres.length; i++) if (centre > centres[i]) over = i;
      if (centre <= centres[0]) over = 0;
      return { ...current, dx, over };
    });
  };

  const endDrag = () => {
    // Read the drag from state and call each setter separately. Doing the
    // commit inside a setDrag updater is what broke this the first time: React
    // may replay an updater, so movePrint ran twice from a shifting base and
    // the print landed one slot short of where it had been dragged. Updaters
    // must be pure; this is an event handler, so plain state is current here.
    if (!drag) return;
    const { from, over } = drag;
    setDrag(null);
    if (from === over) return;
    setPrints(prev => movePrint(prev, from, over));
    setOrderMessage(`Print moved from position ${from + 1} to ${over + 1} of ${prints.length}.`);
  };

  /**
   * How far a print that is NOT being dragged must slide to make room.
   *
   * Every print in this catalogue is 50 cm wide, so one slot is one step; the
   * step is measured rather than assumed so a future size of a different
   * width still lands correctly.
   */
  const shiftFor = (index: number) => {
    if (!drag || index === drag.from) return 0;
    if (drag.from < drag.over && index > drag.from && index <= drag.over) return -drag.step;
    if (drag.from > drag.over && index >= drag.over && index < drag.from) return drag.step;
    return 0;
  };

  const previewScale = Math.min(1, safeWallWidth / Math.max(result.totalWidth, safeWallWidth));
  const arrangementPercent = Math.max(8, (result.totalWidth / Math.max(result.totalWidth, safeWallWidth)) * 100);
  // Widths in the preview are proportional to the real widths, not equal
  // shares, so the picture stays honest if the catalogue ever adds a size
  // that is not 50 cm wide.
  const printsWidth = safePrints.reduce((sum, key) => sum + PRINT_SIZES[key].width, 0);

  const statusCopy = {
    fit: 'That fits comfortably. The frames should read as one group, with enough room around them.',
    tight: 'It fits, but only just. Check nearby furniture, switches and corners before you hang.',
    exact: 'It fits exactly, with no space left at either side. Give it a little breathing room before reaching for the drill.',
    'no-fit': `This arrangement is ${formatCentimetres(result.overflow)} wider than the wall. Remove a print or reduce the gap.`,
  }[result.fitStatus];

  const liveCopy = result.fitStatus === 'no-fit'
    ? `This row is ${formatCentimetres(result.overflow)} wider than your wall. Try fewer prints, a smaller size or a narrower gap.`
    : result.fitStatus === 'exact' || result.fitStatus === 'tight'
      ? statusCopy
      : result.gapStatus === 'tight'
        ? 'The row fits, but the frames may feel cramped. Try a gap of 5 to 8 cm if the wall allows.'
        : result.gapStatus === 'wide'
          ? 'The row fits, but the frames may start to feel separate. Bring the gap back to 5 to 8 cm.'
          : statusCopy;

  const mixed = new Set(safePrints).size > 1;

  return (
    <section className="not-prose my-10 scroll-mt-20 border-y border-neutral-300 py-7" aria-labelledby={`${id}-title`}>
      <div className="mb-6 max-w-2xl">
        <h3 id={`${id}-title`} className="text-2xl font-medium text-neutral-900">Gallery wall spacing calculator</h3>
        <p className="mt-2 leading-relaxed text-neutral-700">Set a size for each print and see how the row will sit on your wall. Mixing sizes is what stops a row looking like a shop display.</p>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-wall`}>
          Wall width <span className="font-normal text-neutral-600">(cm)</span>
          <input id={`${id}-wall`} type="number" inputMode="decimal" min="1" max="1200" step="1" value={wallWidthInput} aria-invalid={Boolean(wallError)} aria-describedby={`${id}-wall-help${wallError ? ` ${id}-wall-error` : ''}`} onChange={event => setWallWidthInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-wall-help`} className="mt-1 block text-xs font-normal text-neutral-600">Measure the usable wall space, not the whole room.</span>
          {wallError && <span id={`${id}-wall-error`} className="mt-1 block text-xs font-normal text-destructive">{wallError}</span>}
        </label>

        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-gap`}>
          Gap between frames <span className="font-normal text-neutral-600">(cm)</span>
          <input id={`${id}-gap`} type="number" inputMode="decimal" min="0" max="30" step="0.5" value={gapInput} aria-invalid={Boolean(gapError)} aria-describedby={`${id}-gap-help${gapError ? ` ${id}-gap-error` : ''}`} onChange={event => setGapInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-gap-help`} className="mt-1 block text-xs font-normal text-neutral-600">A gap of 5 to 8 cm usually keeps the frames reading as one group.</span>
          {gapError && <span id={`${id}-gap-error`} className="mt-1 block text-xs font-normal text-destructive">{gapError}</span>}
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-neutral-800">Your prints, left to right</legend>
        <p className="mt-1 text-xs text-neutral-600">{prints.length} of {MAX_PRINTS}. Each one can be a different size. Drag the prints in the preview below to reorder them, or use the arrows here.</p>
        <ul className="mt-3 flex flex-wrap gap-3">
          {prints.map((size, index) => (
            <li
              key={index}
              className="flex items-end gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-2"
            >
              <label className="text-xs font-medium text-neutral-700" htmlFor={`${id}-print-${index}`}>
                Print {index + 1}
                <select id={`${id}-print-${index}`} value={size} onChange={event => setPrintAt(index, event.currentTarget.value as PrintSizeKey)} className="mt-1 block min-h-11 rounded-md border border-neutral-300 bg-white px-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
                  {Object.entries(PRINT_SIZES).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
                </select>
              </label>
              {/* Dragging alone would shut out anyone on a keyboard, and HTML5
                  drag does not work on touch at all. These are the same
                  reorder, reachable by tab or thumb - WCAG 2.1.1 and 2.5.7. */}
              <span className="flex flex-col gap-0.5">
                <button type="button" onClick={() => reorder(index, index - 1)} disabled={index === 0} className="min-h-5 rounded border border-neutral-300 px-1.5 text-xs leading-none text-neutral-700 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  <span aria-hidden="true">←</span><span className="sr-only">Move print {index + 1} left</span>
                </button>
                <button type="button" onClick={() => reorder(index, index + 1)} disabled={index === prints.length - 1} className="min-h-5 rounded border border-neutral-300 px-1.5 text-xs leading-none text-neutral-700 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  <span aria-hidden="true">→</span><span className="sr-only">Move print {index + 1} right</span>
                </button>
              </span>
              <button type="button" onClick={() => removePrintAt(index)} disabled={prints.length <= 1} className="min-h-11 rounded-md border border-neutral-300 px-2 text-xs text-neutral-700 transition-colors hover:border-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                Remove<span className="sr-only"> print {index + 1}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addPrint} disabled={prints.length >= MAX_PRINTS} className="mt-3 min-h-11 rounded-md border border-neutral-900 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Add a print
        </button>
        {printsError && <p className="mt-1 text-xs text-destructive">{printsError}</p>}
      </fieldset>

      <div className="mt-7">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">Wall preview <span className="normal-case tracking-normal text-neutral-500">— drag a print, the others make room</span></p>
        {/* The preview is where the prints are actually arranged, so it is the
            drag surface: you move the picture, not a form row. It stays
            aria-hidden because it is a second representation of the same list
            the fieldset above already announces, and the reorder it offers is
            available there through labelled Move left / Move right buttons.
            Nothing here is focusable, so nothing focusable is hidden. */}
        <div className="h-40 overflow-hidden border border-neutral-300 px-3 pb-4 pt-6 sm:h-[180px] sm:px-6" aria-hidden="true">
        <div className="mx-auto flex h-full max-w-full items-center justify-center overflow-hidden border-x border-b border-neutral-300" style={{ width: `${previewScale * 100}%` }}>
          <div
            ref={rowRef}
            onPointerMove={event => { if (drag) moveDrag(event.clientX); }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="flex max-w-full items-center justify-center"
            style={{ width: `${arrangementPercent}%`, gap: `${Math.max(2, safeGap * 0.55)}px` }}
          >
            {safePrints.map((key, index) => {
              const print = PRINT_SIZES[key];
              const isDragging = drag?.from === index;
              const shift = shiftFor(index);
              return (
                <div
                  key={index}
                  onPointerDown={event => {
                    // Left button / primary contact only, and take over from
                    // the browser so no text selection or native drag starts.
                    if (event.button !== 0) return;
                    event.preventDefault();
                    beginDrag(index, event.clientX, event.currentTarget, event.pointerId);
                  }}
                  title={`Print ${index + 1}, ${print.label}. Drag to reorder.`}
                  className={`shrink border-2 bg-neutral-100 p-1 ${isDragging ? 'z-10 cursor-grabbing border-neutral-900 shadow-lg' : 'cursor-grab border-neutral-800'}`}
                  style={{
                    aspectRatio: `${print.width} / ${print.height}`,
                    width: `${(print.width / printsWidth) * 100}%`,
                    maxWidth: print.height === 70 ? '54px' : '62px',
                    // The dragged print tracks the pointer with no transition,
                    // or it would lag behind the finger. Everything else eases,
                    // which is the whole feel of it.
                    transform: isDragging
                      ? `translateX(${drag?.dx ?? 0}px) scale(1.06)`
                      : `translateX(${shift}px)`,
                    transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.2, 0, 0, 1)',
                    // Stops a touch drag scrolling the article instead.
                    touchAction: 'none',
                  }}
                >
                  <div className="h-full w-full border border-neutral-300" />
                </div>
              );
            })}
          </div>
        </div></div>
      </div>

      <h4 className="mt-6 text-lg font-medium text-neutral-900">Your arrangement</h4>
      <div className="mt-2 grid grid-cols-2 border-y border-neutral-300 sm:grid-cols-4 sm:divide-x sm:divide-neutral-300">
        <div className="py-4 sm:pr-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Whole row</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(result.totalWidth) : '—'}</strong></div>
        <div className="py-4 sm:px-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Space at each side</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{!isValid ? '—' : result.fitStatus === 'no-fit' ? 'Does not fit' : formatCentimetres(result.sideMargin)}</strong></div>
        <div className="border-t border-neutral-300 py-4 sm:border-t-0 sm:px-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Tallest print</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(result.rowHeight) : '—'}</strong></div>
        <div className="border-t border-neutral-300 py-4 sm:border-t-0 sm:pl-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Gap between frames</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(gap) : '—'}</strong></div>
      </div>

      <div className="mt-5 text-sm leading-relaxed text-neutral-800" role="status" aria-live="polite" aria-atomic="true">
        <p className="font-medium">{isValid ? liveCopy : 'Complete the fields above to see your arrangement.'}</p>
        {orderMessage && <p className="mt-1 font-normal text-neutral-700">{orderMessage}</p>}
        {isValid && mixed && <p className="mt-1 font-normal text-neutral-700">With sizes mixed, hang them on a shared centre line rather than a shared top edge, or the row will look accidental.</p>}
      </div>

      <p className="mt-5 text-sm text-neutral-700">This is a planning guide based on print dimensions. Frames add a little width, so measure their outside edges before fixing any hooks.</p>
      <p className="mt-5 text-sm text-neutral-700">Now find the pieces that will make the row worth hanging.</p>
      <TrackedLink event="gallery-wall-calculator-products-click" eventData={{ article: 'create-an-art-wall' }} href={`${localePrefix}/products`} className="mt-2 inline-flex min-h-11 items-center border-b border-neutral-900 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Browse the print collection <span aria-hidden="true" className="ml-1">→</span></TrackedLink>
    </section>
  );
}
