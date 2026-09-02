'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import { chromeAria } from '@/lib/i18n';
import {
  alignFromDrag,
  alignmentOffset,
  calculateGalleryWall,
  decodeArrangement,
  encodeArrangement,
  EYE_LEVEL_CM,
  formatCentimetres,
  layoutGalleryWall,
  movePrintTo,
  PRESETS,
  PRINT_SIZES,
  sizeCounts,
  type PrintAlign,
  type PrintSizeKey,
  type WallPrint,
  type WallRow,
} from '@/lib/gallery-wall-calculator';

/**
 * The gallery wall planner: an elevation drawing of your wall, to scale, with
 * the prints hanging on it and the measurements written on the drawing the
 * way an architect would write them.
 *
 * The wall is the interface. You drag prints about on it, tap one to change
 * its size, and add more from the ghost slots at the end of each row. There
 * is no form-then-preview split: the drawing is projected from the same
 * numbers the hanging plan prints, so what you see is what you will measure.
 *
 * The one contract every interaction here keeps: NOTHING MOVES ON RELEASE.
 * While a print is dragged the wall renders the arrangement you will get, and
 * letting go commits that same value. lib/gallery-wall-drag.test.ts holds it.
 */

const DEFAULTS = { wallWidth: 240, wallHeight: '', gap: 6, centreHeight: EYE_LEVEL_CM };
const MAX_PRINTS = 12;
/** The one curve everything on the wall moves with, so it all feels like one material. */
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const REFLOW_MS = 260;
const SETTLE_MS = 180;
/** Pointer travel before a press becomes a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 5;
/** A sofa for scale: a typical three-seater. */
const SOFA = { width: 200, height: 85 };

type Print = WallPrint & { id: string };
type Position = { row: number; index: number };

/**
 * Ids for the first render come from POSITION, so the server and the client
 * hand out the same ones. A module-level counter does not: the server's copy
 * of this module has already numbered prints for other requests, and React
 * then finds "print-5" in the HTML where the client expects "print-0".
 * Prints made later, on the client only, use a per-instance counter.
 */
const seededIds = (rows: readonly WallRow[]): Print[][] =>
  rows.map((row, r) => row.map((print, i) => ({ ...print, id: `print-${r}-${i}` })));

const ALIGNMENTS: { value: PrintAlign; label: string; glyph: string }[] = [
  { value: 'top', label: 'Hang level with the top of the row', glyph: '⤒' },
  { value: 'centre', label: 'Centre in the row', glyph: '↕' },
  { value: 'bottom', label: 'Hang level with the bottom of the row', glyph: '⤓' },
];

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * `locale` follows LandingCrossLinks: the component carries its own prefix so
 * a literal English path cannot leak on a Norwegian render. There is no
 * Norwegian article route today, so this changes nothing yet - but
 * lib/i18n-no.test.ts sweeps EVERY component rather than a hand-picked list.
 */
export function GalleryWallCalculator({ locale = 'en' }: { locale?: 'en' | 'no' } = {}) {
  const localePrefix = locale === 'no' ? '/no' : '';
  const aria = chromeAria[locale].wallPlanner;
  const id = useId();

  const [wallWidthInput, setWallWidthInput] = useState(String(DEFAULTS.wallWidth));
  const [wallHeightInput, setWallHeightInput] = useState(DEFAULTS.wallHeight);
  const [gapInput, setGapInput] = useState(String(DEFAULTS.gap));
  const [centreInput, setCentreInput] = useState(String(DEFAULTS.centreHeight));
  const [rows, setRows] = useState<Print[][]>(() => seededIds(PRESETS[2].rows));
  const nextId = useRef(0);
  const withIds = (source: readonly WallRow[]): Print[][] =>
    source.map(row => row.map(print => ({ ...print, id: `print-c${nextId.current++}` })));
  const [showSofa, setShowSofa] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState('');
  const [copied, setCopied] = useState<'plan' | 'link' | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /**
   * A drag in flight. `from` and `over` are positions in the COMMITTED rows,
   * which is what movePrintTo takes; the wall renders that move applied.
   *
   * The print you hold is drawn twice: a faded slot where it will land, and a
   * copy pinned to the pointer. "Where will this go" and "what am I holding"
   * are two questions, and one element cannot answer both.
   */
  const [drag, setDrag] = useState<{
    id: string;
    from: Position;
    over: Position;
    align: PrintAlign;
    pointer: { x: number; y: number };
    grab: { x: number; y: number };
    size: { width: number; height: number };
    /** Set on release: the copy glides here, then the slot takes over. */
    settle: { left: number; top: number } | null;
  } | null>(null);

  const wallRef = useRef<HTMLDivElement | null>(null);
  /**
   * A press that has not yet become a drag. Pointerdown records it; the first
   * move past DRAG_THRESHOLD_PX turns it into `drag`, and a release before
   * that is a tap, which selects. Refs because pointerdown sets state
   * asynchronously and the first pointermove arrives before the state exists.
   */
  const pressRef = useRef<{
    id: string;
    from: Position;
    print: Print;
    start: { x: number; y: number };
    grab: { x: number; y: number };
    size: { width: number; height: number };
    cmPerPx: number;
    pointerId: number;
    dragging: boolean;
  } | null>(null);
  const overRef = useRef<Position>({ row: 0, index: 0 });
  const settleTimer = useRef<number | null>(null);
  const refocusRef = useRef<string | null>(null);

  const wallWidth = Number(wallWidthInput);
  const wallHeight = wallHeightInput === '' ? undefined : Number(wallHeightInput);
  const gap = Number(gapInput);
  const centreHeight = Number(centreInput);
  const printCount = rows.reduce((count, row) => count + row.length, 0);

  const wallError = wallWidthInput === '' ? 'Enter your wall width.' : !(wallWidth > 0) ? 'Use a wall width greater than 0 cm.' : '';
  const heightError = wallHeightInput !== '' && !(wallHeight !== undefined && wallHeight > 0) ? 'Use a height greater than 0 cm, or leave it blank.' : '';
  const gapError = gapInput === '' ? 'Enter the gap between frames.' : !(gap >= 0) ? 'The gap can’t be less than 0 cm.' : '';
  const centreError = centreInput === '' || !(centreHeight > 0) ? 'Enter the height of the group’s centre from the floor.' : '';
  const isValid = !wallError && !heightError && !gapError && !centreError;

  const safeWallWidth = wallError ? DEFAULTS.wallWidth : wallWidth;
  const safeGap = gapError ? DEFAULTS.gap : gap;
  const safeCentre = centreError ? DEFAULTS.centreHeight : centreHeight;
  const safeWallHeight = heightError ? undefined : wallHeight;

  /**
   * The arrangement as it will be when the drag is released: the move already
   * applied, the alignment already set. THIS is what gets rendered and
   * measured, so the drop cannot disagree with the preview.
   */
  const displayRows: readonly Print[][] = (() => {
    // Once the drop has committed, `rows` IS the preview; applying the move
    // again while the copy settles would move the print twice.
    if (!drag || drag.settle) return rows;
    const withAlign = rows.map((row, ri) =>
      row.map((print, i) => (ri === drag.from.row && i === drag.from.index ? { ...print, align: drag.align } : print))
    );
    const samePlace = drag.from.row === drag.over.row && drag.from.index === drag.over.index;
    return samePlace ? withAlign : movePrintTo(withAlign, drag.from, drag.over);
  })();

  const inputs = { wallWidth: safeWallWidth, wallHeight: safeWallHeight, rows: displayRows, gap: safeGap };
  const result = calculateGalleryWall(inputs);
  const layout = layoutGalleryWall(inputs, safeCentre);

  /**
   * The drawing's extent, in centimetres. Floor at the bottom always: "from
   * the floor" is the measurement anyone hanging a picture actually takes.
   *
   * Fixed by the WALL, never by what hangs on it. An earlier version grew the
   * drawing to fit the group, which rescaled everything under the pointer the
   * moment a drag made a new row - remapping the pointer to a different row,
   * which undid the new row, which rescaled back. A typical ceiling stands in
   * when no height is given; a group that overflows it does not fit a room.
   */
  const TYPICAL_CEILING = 260;
  const drawWidth = safeWallWidth;
  const drawHeight = safeWallHeight ?? TYPICAL_CEILING;
  const x = (cm: number) => `${(cm / drawWidth) * 100}%`;
  const y = (fromFloor: number) => `${((drawHeight - fromFloor) / drawHeight) * 100}%`;
  const w = (cm: number) => `${(cm / drawWidth) * 100}%`;
  const h = (cm: number) => `${(cm / drawHeight) * 100}%`;

  const widestRow = result.rowWidths.length ? result.rowWidths.indexOf(result.totalWidth) : -1;
  const groupLeft = widestRow >= 0 ? layout.rowLefts[widestRow] : drawWidth / 2;
  const groupRight = groupLeft + result.totalWidth;
  const tooTall = result.fitsHeight === false;
  const tooWide = result.overflow > 0;

  /* ------------------------------------------------------------------ URL */

  // Read a plan out of the URL once, then write every change back into it.
  // The hash is only known on the client, so this cannot be an initialiser
  // without the server and client disagreeing; the first microtask after
  // mount is the earliest honest moment, and it lands before any paint.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const match = /plan=([^&]+)/.exec(window.location.hash);
      const plan = match ? decodeArrangement(decodeURIComponent(match[1])) : null;
      if (plan) {
        setWallWidthInput(String(plan.wallWidth));
        setWallHeightInput(plan.wallHeight === undefined ? '' : String(plan.wallHeight));
        setGapInput(String(plan.gap));
        setCentreInput(String(plan.centreHeight));
        setRows(withIds(plan.rows));
      }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated || !isValid || drag) return;
    const encoded = encodeArrangement({ wallWidth, wallHeight, gap, centreHeight, rows });
    const next = `#plan=${encodeURIComponent(encoded)}`;
    if (window.location.hash !== next) window.history.replaceState(null, '', next);
  }, [hydrated, isValid, drag, wallWidth, wallHeight, gap, centreHeight, rows]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  // A keyboard move re-parents the print's node, which drops focus. Put it back.
  useEffect(() => {
    const target = refocusRef.current;
    if (!target) return;
    refocusRef.current = null;
    wallRef.current?.querySelector<HTMLElement>(`[data-print-id="${target}"]`)?.focus();
  }, [rows]);

  /* ---------------------------------------------------------------- edits */

  const announce = (message: string) => setOrderMessage(message);

  const updatePrint = (printId: string, patch: Partial<WallPrint>) =>
    setRows(current => current.map(row => row.map(print => (print.id === printId ? { ...print, ...patch } : print))));

  const removePrint = (printId: string) => {
    setRows(current => current.map(row => row.filter(print => print.id !== printId)).filter(row => row.length));
    if (selected === printId) setSelected(null);
    announce('Print removed.');
  };

  const addPrint = (rowIndex: number, size: PrintSizeKey) => {
    if (printCount >= MAX_PRINTS) return;
    const [print] = withIds([[{ size, align: 'centre' }]]).flat();
    setRows(current => {
      if (rowIndex >= current.length) return [...current, [print]];
      return current.map((row, ri) => (ri === rowIndex ? [...row, print] : row));
    });
    setSelected(print.id);
    announce(rowIndex >= rows.length ? 'Print added in a new row.' : `Print added to row ${rowIndex + 1}.`);
  };

  const applyPreset = (key: string) => {
    const preset = PRESETS.find(entry => entry.key === key);
    if (!preset) return;
    setRows(withIds(preset.rows));
    setSelected(null);
    announce(`${preset.label} arrangement.`);
  };

  const positionOf = (printId: string): Position | null => {
    for (let row = 0; row < rows.length; row++) {
      const index = rows[row].findIndex(print => print.id === printId);
      if (index >= 0) return { row, index };
    }
    return null;
  };

  /** The keyboard path: one move, announced, focus kept. */
  const moveBy = (printId: string, to: Position) => {
    const from = positionOf(printId);
    if (!from) return;
    const next = movePrintTo(rows, from, to);
    setRows(next);
    refocusRef.current = printId;
    const landedRow = next.findIndex(row => row.some(print => print.id === printId));
    const landedIndex = next[landedRow]?.findIndex(print => print.id === printId) ?? 0;
    announce(`Print moved to row ${landedRow + 1}, position ${landedIndex + 1}.`);
  };

  const onPrintKey = (event: React.KeyboardEvent, print: Print, position: Position) => {
    const { row, index } = position;
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => index > 0 && moveBy(print.id, { row, index: index - 1 }),
      ArrowRight: () => index < rows[row].length - 1 && moveBy(print.id, { row, index: index + 1 }),
      ArrowUp: () => moveBy(print.id, { row: row - 1, index: row > 0 ? Math.min(index, rows[row - 1].length) : 0 }),
      ArrowDown: () => moveBy(print.id, { row: row + 1, index: row < rows.length - 1 ? Math.min(index, rows[row + 1].length) : 0 }),
      Enter: () => setSelected(current => (current === print.id ? null : print.id)),
      ' ': () => setSelected(current => (current === print.id ? null : print.id)),
      Escape: () => setSelected(null),
      Delete: () => removePrint(print.id),
      Backspace: () => removePrint(print.id),
      s: () => updatePrint(print.id, { size: print.size === '50x70' ? '50x50' : '50x70' }),
    };
    const handler = handlers[event.key];
    if (!handler) return;
    event.preventDefault();
    handler();
  };

  /* ----------------------------------------------------------------- drag */

  const onPrintPointerDown = (event: React.PointerEvent<HTMLElement>, print: Print, position: Position) => {
    if (event.button !== 0) return;
    if (drag && !drag.settle) return;
    // A press during the previous drop's settle takes over: the settle is a
    // flourish, and a person moving quickly should never be refused by one.
    if (drag) {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      setDrag(null);
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    pressRef.current = {
      id: print.id,
      from: position,
      print,
      start: { x: event.clientX, y: event.clientY },
      grab: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      size: { width: rect.width, height: rect.height },
      cmPerPx: rect.height > 0 ? PRINT_SIZES[print.size].height / rect.height : 1,
      pointerId: event.pointerId,
      dragging: false,
    };
    // Captured on the WALL, not the print: a print that changes row is
    // re-parented, and re-parenting a node silently drops its capture.
    wallRef.current?.setPointerCapture(event.pointerId);
  };

  const onWallPointerMove = (event: React.PointerEvent) => {
    const press = pressRef.current;
    const wall = wallRef.current;
    if (!press || !wall) return;
    const { clientX, clientY } = event;

    if (!press.dragging) {
      if (Math.hypot(clientX - press.start.x, clientY - press.start.y) < DRAG_THRESHOLD_PX) return;
      press.dragging = true;
      overRef.current = press.from;
      setSelected(null);
      setDrag({
        id: press.id,
        from: press.from,
        over: press.from,
        align: press.print.align,
        pointer: { x: clientX, y: clientY },
        grab: press.grab,
        size: press.size,
        settle: null,
      });
      return;
    }

    /**
     * Hit-test against the MODEL, projected through the wall's rect, not
     * against the DOM. The other prints are mid-glide for a quarter of a
     * second after every change, and reading their rects then makes the
     * target flicker as a neighbour slides through the pointer. The model
     * holds only resting positions, so the target is decided once per move.
     */
    const wallRect = wall.getBoundingClientRect();
    const toClientX = (cm: number) => wallRect.left + (cm / drawWidth) * wallRect.width;
    const toClientY = (fromFloor: number) => wallRect.top + ((drawHeight - fromFloor) / drawHeight) * wallRect.height;

    const bands = layout.rowTops.map((top, ri) => ({
      top: toClientY(top),
      bottom: toClientY(top - result.rowHeights[ri]),
      slots: layout.prints
        .filter(placed => placed.row === ri && displayRows[ri][placed.index].id !== press.id)
        .map(placed => ({ id: displayRows[ri][placed.index].id, centre: toClientX(placed.left + placed.width / 2) })),
    }));

    let over: Position;
    if (!bands.length) {
      over = { row: 0, index: 0 };
    } else {
      const first = bands[0];
      const last = bands[bands.length - 1];
      // A third of the outer row clear of the group is how a print asks for a
      // row of its own: far enough that a wobble cannot do it, near enough
      // that you never wonder whether it is possible.
      const above = Math.max(12, (first.bottom - first.top) * 0.35);
      const below = Math.max(12, (last.bottom - last.top) * 0.35);
      if (clientY < first.top - above) {
        over = { row: -1, index: 0 };
      } else if (clientY > last.bottom + below) {
        over = { row: rows.length, index: 0 };
      } else {
        let nearest = 0;
        let best = Infinity;
        bands.forEach((band, i) => {
          const distance = clientY < band.top ? band.top - clientY : clientY > band.bottom ? clientY - band.bottom : 0;
          if (distance < best) {
            best = distance;
            nearest = i;
          }
        });
        const band = bands[nearest];
        const anchor = band.slots[0]?.id;
        const committed = anchor ? rows.findIndex(row => row.some(print => print.id === anchor)) : -1;
        // A band holding nothing but the held print exists only because this
        // drag made it, so it says nothing new about the target.
        over = committed < 0 ? overRef.current : { row: committed, index: band.slots.filter(slot => clientX > slot.centre).length };
      }
    }
    overRef.current = over;

    const self = rows[press.from.row]?.[press.from.index];
    const align = !self
      ? 'centre'
      : over.row === press.from.row
        ? alignFromDrag(self, result.rowHeights[press.from.row] ?? 0, (clientY - press.start.y) * press.cmPerPx)
        : self.align;

    setDrag(current => (current ? { ...current, over, align, pointer: { x: clientX, y: clientY } } : current));
  };

  const onWallPointerUp = () => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;

    if (!press.dragging) {
      setSelected(current => (current === press.id ? null : press.id));
      return;
    }
    if (!drag) return;

    // The wall is ALREADY showing this arrangement, so committing it is not a
    // move: the preview becomes permanent and nothing on screen shifts.
    setRows(displayRows.map(row => [...row]));

    const samePlace = drag.from.row === drag.over.row && drag.from.index === drag.over.index;
    const wasAlign = rows[drag.from.row]?.[drag.from.index]?.align;
    if (samePlace && wasAlign !== drag.align) {
      announce(drag.align === 'centre' ? 'Print centred in its row.' : `Print hung level with the ${drag.align} of its row.`);
    } else if (!samePlace) {
      const landedRow = displayRows.findIndex(row => row.some(print => print.id === drag.id));
      const landedIndex = displayRows[landedRow]?.findIndex(print => print.id === drag.id) ?? 0;
      announce(`Print moved to row ${landedRow + 1}, position ${landedIndex + 1}.`);
    }

    // The copy under the pointer glides into its slot before the slot takes
    // over, so the drop reads as the print settling rather than blinking.
    const slot = wallRef.current?.querySelector<HTMLElement>(`[data-print-id="${drag.id}"]`)?.getBoundingClientRect();
    if (!slot || reducedMotion()) {
      setDrag(null);
      return;
    }
    setDrag(current => (current ? { ...current, settle: { left: slot.left, top: slot.top } } : current));
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    // transitionend clears it; this is for a copy that had nowhere to travel.
    settleTimer.current = window.setTimeout(() => setDrag(null), SETTLE_MS + 60);
  };

  useEffect(() => () => { if (settleTimer.current) window.clearTimeout(settleTimer.current); }, []);

  /* --------------------------------------------------------------- derived */

  const heldDisplayRow = drag ? displayRows.findIndex(row => row.some(print => print.id === drag.id)) : -1;
  const selectedPlaced = selected
    ? layout.prints.find(placed => displayRows[placed.row]?.[placed.index]?.id === selected) ?? null
    : null;
  const selectedPrint = selected ? displayRows.flat().find(print => print.id === selected) ?? null : null;
  const selectedSlack = selectedPrint && selectedPlaced ? alignmentOffset(selectedPrint, result.rowHeights[selectedPlaced.row]).slack : 0;

  const counts = sizeCounts(displayRows);
  const shoppingList = (Object.keys(PRINT_SIZES) as PrintSizeKey[])
    .filter(size => counts[size])
    .map(size => `${counts[size]} × ${PRINT_SIZES[size].label.split(',')[0]}`)
    .join(' and ');

  const statusCopy = !isValid
    ? 'Complete the measurements above to see your plan.'
    : printCount === 0
      ? 'Add a print to begin.'
      : tooTall
        ? `${formatCentimetres(result.heightOverflow)} too tall for the wall. Move a print into another row, or take one away.`
        : tooWide
          ? `${formatCentimetres(result.overflow)} too wide for the wall. Move a print into another row, or take one away.`
          : result.fitStatus === 'exact'
            ? 'Exactly the width of the wall, with nothing to spare. Give it some breathing room before you drill.'
            : result.fitStatus === 'tight'
              ? 'It fits, but only just. Check switches, corners and furniture before you hang.'
              : result.gapStatus === 'tight'
                ? 'It fits. The frames may feel cramped at this gap; 5 to 8 cm usually reads best.'
                : result.gapStatus === 'wide'
                  ? 'It fits. At this gap the frames may start to feel separate; 5 to 8 cm usually reads best.'
                  : 'That fits comfortably, with room around the group.';

  // The drawing is honest about a sofa: a group centred at eye level often
  // hangs BEHIND one. Say so, with the number that fixes it, rather than
  // leaving the reader to notice.
  const sofaClearance = SOFA.height + 20;
  const sofaCentre = Math.ceil(safeCentre + (sofaClearance - layout.groupBottom));
  const sofaAdvice = showSofa && printCount > 0 && isValid && layout.groupBottom < sofaClearance;

  const planText = () => {
    const lines = [
      `Hanging plan — ${formatCentimetres(safeWallWidth)} wall, group centred ${formatCentimetres(safeCentre)} from the floor`,
      '',
    ];
    displayRows.forEach((row, ri) => {
      lines.push(`Row ${ri + 1}`);
      row.forEach((print, i) => {
        const placed = layout.prints.find(entry => entry.row === ri && entry.index === i);
        if (!placed) return;
        lines.push(`  Print ${i + 1}, ${PRINT_SIZES[print.size].label.split(',')[0]}: left edge ${formatCentimetres(round(placed.left))} from the left, top edge ${formatCentimetres(round(placed.topFromFloor))} from the floor`);
      });
    });
    lines.push('', 'Frames usually hang 3 to 5 cm below their hook. Check yours before marking.', window.location.href);
    return lines.join('\n');
  };

  const copy = async (kind: 'plan' | 'link') => {
    try {
      await navigator.clipboard.writeText(kind === 'plan' ? planText() : window.location.href);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  };

  const transition = `all ${REFLOW_MS}ms ${EASE}`;

  const numberField = (
    key: string,
    label: string,
    value: string,
    onChange: (next: string) => void,
    help: string,
    error: string,
    extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}
  ) => (
    <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-${key}`}>
      {label}
      <span className="mt-1 flex items-baseline gap-1.5">
        <input
          id={`${id}-${key}`}
          type="number"
          inputMode="decimal"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-${key}-help${error ? ` ${id}-${key}-error` : ''}`}
          onChange={event => onChange(event.currentTarget.value)}
          className="min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base tabular-nums text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive"
          {...extra}
        />
        <span className="text-sm text-neutral-500">cm</span>
      </span>
      <span id={`${id}-${key}-help`} className="mt-1 block text-xs font-normal text-neutral-600">{help}</span>
      {error && <span id={`${id}-${key}-error`} className="mt-1 block text-xs font-normal text-destructive">{error}</span>}
    </label>
  );

  return (
    <section className="not-prose my-10 scroll-mt-20 border-y border-neutral-300 py-7" aria-labelledby={`${id}-title`}>
      <style>{`
        @keyframes gw-print-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } }
        @keyframes gw-pop-in { from { opacity: 0; transform: translate(-50%, 4px) scale(0.96); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .gw-wall * { transition: none !important; animation: none !important; } }
      `}</style>

      <div className="mb-6 max-w-2xl">
        <h3 id={`${id}-title`} className="text-2xl font-medium text-neutral-900">Plan your wall</h3>
        <p className="mt-2 leading-relaxed text-neutral-700">
          Your wall, to scale. Drag the prints where you want them, tap one to change its size, and read the hanging measurements straight off the drawing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
        {numberField('wall', 'Wall width', wallWidthInput, setWallWidthInput, 'Skirting to ceiling is not needed; just the width you can use.', wallError, { min: 1, max: 2000, step: 1 })}
        {numberField('height', 'Wall height', wallHeightInput, setWallHeightInput, 'Optional. Adds the ceiling and checks the fit.', heightError, { min: 1, max: 1000, step: 1, placeholder: 'Optional' })}
        {numberField('gap', 'Gap between frames', gapInput, setGapInput, '5 to 8 cm, between prints and between rows.', gapError, { min: 0, max: 30, step: 0.5 })}
        {numberField('centre', 'Centre of the group', centreInput, setCentreInput, `From the floor. ${EYE_LEVEL_CM} cm is gallery eye level.`, centreError, { min: 30, max: 400, step: 1 })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-neutral-600">Start from</span>
        {PRESETS.map(preset => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.key)}
            className="min-h-9 rounded-full border border-neutral-300 px-3 text-sm text-neutral-800 transition-colors hover:border-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {preset.label}
          </button>
        ))}
        <label className="ml-auto flex min-h-9 cursor-pointer items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={showSofa} onChange={event => setShowSofa(event.currentTarget.checked)} className="size-4 accent-neutral-900" />
          Show a sofa for scale
        </label>
      </div>

      {/* ------------------------------------------------------ the wall */}
      <div className="mt-5">
        <div
          ref={wallRef}
          role="group"
          aria-label={aria.wall}
          onPointerMove={onWallPointerMove}
          onPointerUp={onWallPointerUp}
          onPointerCancel={onWallPointerUp}
          onPointerDown={event => { if (event.target === event.currentTarget) setSelected(null); }}
          className="gw-wall relative mx-auto select-none overflow-hidden border border-neutral-300 bg-[#f7f6f3]"
          style={{
            aspectRatio: `${drawWidth} / ${drawHeight}`,
            width: `min(100%, calc(62vh * ${drawWidth} / ${drawHeight}))`,
            minHeight: '260px',
            touchAction: 'none',
            transition,
          }}
        >
          {/* floor */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-neutral-400" />
          <span className="pointer-events-none absolute bottom-1 right-2 text-[10px] uppercase tracking-wide text-neutral-500">Floor</span>
          {safeWallHeight !== undefined && (
            <span className="pointer-events-none absolute right-2 top-1 text-[10px] uppercase tracking-wide text-neutral-500">Ceiling · {formatCentimetres(safeWallHeight)}</span>
          )}

          {/* eye level */}
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-300" style={{ top: y(EYE_LEVEL_CM), transition }} />
          {(printCount === 0 || tooWide || result.sideMargin >= 22) && (
            <span className="pointer-events-none absolute right-2 text-[10px] tabular-nums text-neutral-500" style={{ top: `calc(${y(EYE_LEVEL_CM)} + 3px)`, transition }}>
              {result.sideMargin >= 50 || printCount === 0 ? `eye level · ${EYE_LEVEL_CM} cm` : 'eye level'}
            </span>
          )}

          {/* sofa */}
          {showSofa && (
            <svg
              aria-hidden="true"
              viewBox="0 0 200 85"
              preserveAspectRatio="none"
              className="pointer-events-none absolute bottom-0 text-neutral-400/80"
              style={{ left: x((drawWidth - SOFA.width) / 2), width: w(SOFA.width), height: h(SOFA.height), transition, animation: 'gw-print-in 260ms both' }}
            >
              <g fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
                <rect x="24" y="12" width="152" height="40" rx="8" />
                <rect x="4" y="34" width="22" height="42" rx="7" />
                <rect x="174" y="34" width="22" height="42" rx="7" />
                <rect x="14" y="50" width="172" height="26" rx="4" />
                <path d="M100 12 v40" strokeOpacity="0.5" />
                <path d="M22 76 v9 M178 76 v9" />
              </g>
            </svg>
          )}

          {/* row bands: the drop targets, and a faint tint under the row a drag is heading for */}
          {layout.rowTops.map((top, ri) => (
            <div
              key={ri}
              data-wall-row=""
              data-row={ri}
              className={`pointer-events-none absolute inset-x-0 ${heldDisplayRow === ri ? 'bg-neutral-900/[0.04]' : 'bg-transparent'}`}
              style={{ top: y(top), height: h(result.rowHeights[ri]), transition }}
            />
          ))}

          {/* Dimensions, laid out the way a plan lays them out: one dimension
              string above the group (margin, width, margin), clear of the sofa
              and the add-slots, the verticals on the left where nothing else lives. The group is
              centred AT eye level, so anything placed at its mid-height on
              the right lands on the eye-level label - learned the hard way. */}
          {printCount > 0 && !tooWide && (
            <>
              <Dimension axis="x" from={0} to={groupLeft} at={layout.groupTop + 10} x={x} y={y} w={w} label={formatCentimetres(round(result.sideMargin))} transition={transition} />
              <Dimension axis="x" from={groupLeft} to={groupRight} at={layout.groupTop + 10} x={x} y={y} w={w} label={formatCentimetres(round(result.totalWidth))} transition={transition} />
              <Dimension axis="x" from={groupRight} to={drawWidth} at={layout.groupTop + 10} x={x} y={y} w={w} label={formatCentimetres(round(result.sideMargin))} transition={transition} />
            </>
          )}
          {printCount > 0 && tooWide && (
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded bg-destructive px-2 py-0.5 text-[11px] font-medium text-destructive-foreground" style={{ top: `calc(${y(layout.groupBottom)} + 8px)` }}>
              {formatCentimetres(round(result.overflow))} too wide
            </span>
          )}
          {/* floor to the top edge: the measurement you actually take */}
          {printCount > 0 && !tooWide && groupLeft >= 12 && (
            <Dimension axis="y" from={0} to={layout.groupTop} at={Math.min(8, groupLeft / 2)} x={x} y={y} h={h} label={`${formatCentimetres(round(layout.groupTop))} floor to top edge`} transition={transition} />
          )}
          {/* group height, just left of the group */}
          {printCount > 0 && !tooWide && groupLeft >= 36 && (
            <Dimension axis="y" from={layout.groupBottom} to={layout.groupTop} at={groupLeft - 8} x={x} y={y} h={h} label={formatCentimetres(round(result.totalHeight))} labelSide="left" transition={transition} className="hidden sm:flex" />
          )}

          {/* the prints */}
          {layout.prints.map(placed => {
            const print = displayRows[placed.row][placed.index];
            const isHeld = drag?.id === print.id;
            const isSelected = selected === print.id;
            const size = PRINT_SIZES[print.size];
            return (
              <div
                key={print.id}
                data-print-id={print.id}
                data-row={placed.row}
                data-index={placed.index}
                data-size={print.size}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Row ${placed.row + 1}, print ${placed.index + 1}, ${size.label}. Left edge ${formatCentimetres(round(placed.left))}, top edge ${formatCentimetres(round(placed.topFromFloor))} from the floor.`}
                onPointerDown={event => onPrintPointerDown(event, print, { row: placed.row, index: placed.index })}
                onKeyDown={event => onPrintKey(event, print, { row: placed.row, index: placed.index })}
                className={`absolute box-border p-[3%] outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
                  isHeld
                    ? 'border-2 border-dashed border-neutral-400 bg-white/40'
                    : `cursor-grab border-2 bg-white ${isSelected ? 'border-neutral-900 shadow-[0_0_0_3px_rgba(23,23,23,0.12)]' : 'border-neutral-800 hover:border-neutral-900 hover:shadow-md'}`
                }`}
                style={{
                  left: x(placed.left),
                  top: y(placed.topFromFloor),
                  width: w(placed.width),
                  height: h(placed.height),
                  transition: `${transition}, box-shadow 120ms ease, border-color 120ms ease`,
                  animation: 'gw-print-in 220ms both',
                }}
              >
                {!isHeld && <div className="h-full w-full border border-neutral-300 bg-[#fbfaf8]" />}
              </div>
            );
          })}

          {/* add slots: one at the end of every row, one for a new row */}
          {!drag && printCount < MAX_PRINTS && layout.rowTops.map((top, ri) => {
            const lastPrint = displayRows[ri].at(-1);
            const size = lastPrint ? PRINT_SIZES[lastPrint.size] : PRINT_SIZES['50x70'];
            const left = layout.rowLefts[ri] + result.rowWidths[ri] + safeGap;
            if (left + size.width > drawWidth) return null;
            return (
              <button
                key={`add-${ri}`}
                type="button"
                onClick={() => addPrint(ri, lastPrint?.size ?? '50x70')}
                aria-label={`Add a ${size.label} print to row ${ri + 1}`}
                className="absolute flex items-center justify-center border border-dashed border-neutral-300 text-neutral-400 opacity-60 transition-[opacity,border-color,color] duration-150 hover:border-neutral-700 hover:text-neutral-800 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                style={{ left: x(left), top: y(top - (result.rowHeights[ri] - size.height) / 2), width: w(size.width), height: h(size.height), transition }}
              >
                <span aria-hidden="true" className="text-lg leading-none">+</span>
              </button>
            );
          })}
          {!drag && printCount < MAX_PRINTS && (
            <button
              type="button"
              onClick={() => addPrint(displayRows.length, displayRows.at(-1)?.at(-1)?.size ?? '50x70')}
              aria-label={printCount === 0 ? 'Add the first print' : 'Add a print in a new row below'}
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-neutral-300 bg-[#f7f6f3] px-3 py-1 text-xs text-neutral-500 transition-colors duration-150 hover:border-neutral-700 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              style={{ top: printCount === 0 ? `calc(${y(EYE_LEVEL_CM)} - 14px)` : `calc(${y(layout.groupBottom)} + ${tooWide ? 36 : 16}px)`, transition }}
            >
              <span aria-hidden="true">+</span> {printCount === 0 ? 'Add a print' : 'New row'}
            </button>
          )}

          {/* selection toolbar */}
          {selectedPrint && selectedPlaced && !drag && (
            <div
              role="toolbar"
              aria-label={aria.selectedPrint}
              className="absolute z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
              style={{
                left: x(selectedPlaced.left + selectedPlaced.width / 2),
                top: `calc(${y(selectedPlaced.topFromFloor)} - 46px)`,
                animation: 'gw-pop-in 140ms both',
                transition,
              }}
            >
              {(Object.keys(PRINT_SIZES) as PrintSizeKey[]).map(size => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selectedPrint.size === size}
                  onClick={() => updatePrint(selectedPrint.id, { size })}
                  className={`min-h-8 rounded-md px-2 text-xs tabular-nums transition-colors ${selectedPrint.size === size ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  {PRINT_SIZES[size].label.split(',')[0]}
                </button>
              ))}
              {selectedSlack > 0 && (
                <>
                  <span className="mx-0.5 h-5 w-px bg-neutral-200" />
                  {ALIGNMENTS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selectedPrint.align === option.value}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => updatePrint(selectedPrint.id, { align: option.value })}
                      className={`min-h-8 min-w-8 rounded-md text-sm transition-colors ${selectedPrint.align === option.value ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                    >
                      <span aria-hidden="true">{option.glyph}</span>
                    </button>
                  ))}
                </>
              )}
              <span className="mx-0.5 h-5 w-px bg-neutral-200" />
              <button
                type="button"
                onClick={() => removePrint(selectedPrint.id)}
                aria-label={aria.removePrint}
                title="Remove"
                className="min-h-8 min-w-8 rounded-md text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-destructive"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          )}
        </div>

        {/* the print under the pointer, pinned to the viewport so the reflowing wall cannot drag it about */}
        {drag && (
          <div
            aria-hidden="true"
            onTransitionEnd={event => {
              if (!drag.settle || event.propertyName !== 'left') return;
              if (settleTimer.current) window.clearTimeout(settleTimer.current);
              setDrag(null);
            }}
            className="pointer-events-none fixed z-50 box-border border-2 border-neutral-900 bg-white shadow-xl"
            style={{
              // In pixels: a percentage on a fixed element resolves against
              // the viewport, not the copy, and drew the mount as a sliver.
              padding: `${drag.size.width * 0.03}px`,
              left: `${drag.settle ? drag.settle.left : drag.pointer.x - drag.grab.x}px`,
              top: `${drag.settle ? drag.settle.top : drag.pointer.y - drag.grab.y}px`,
              width: `${drag.size.width}px`,
              height: `${drag.size.height}px`,
              transform: drag.settle ? 'scale(1)' : 'scale(1.05)',
              transition: drag.settle ? `left ${SETTLE_MS}ms ${EASE}, top ${SETTLE_MS}ms ${EASE}, transform ${SETTLE_MS}ms ${EASE}, box-shadow ${SETTLE_MS}ms ease` : 'transform 120ms ease',
              boxShadow: drag.settle ? '0 0 0 rgba(0,0,0,0)' : undefined,
            }}
          >
            <div className="h-full w-full border border-neutral-300 bg-[#fbfaf8]" />
          </div>
        )}

        <p className="mt-2 text-xs text-neutral-500">
          Drag a print anywhere, including above or below the group for a new row. Tap one to change its size or take it away.
        </p>
      </div>

      {/* ------------------------------------------------------ figures */}
      <div className="mt-6 grid grid-cols-2 border-y border-neutral-300 sm:grid-cols-4 sm:divide-x sm:divide-neutral-300">
        <Figure label="Group width" value={isValid && printCount ? formatCentimetres(round(result.totalWidth)) : '—'} />
        <Figure label="Group height" value={isValid && printCount ? formatCentimetres(round(result.totalHeight)) : '—'} />
        <Figure label="Space each side" value={!isValid || !printCount ? '—' : tooWide ? 'Does not fit' : formatCentimetres(round(result.sideMargin))} tone={tooWide ? 'bad' : undefined} />
        <Figure label="Top edge from floor" value={isValid && printCount ? formatCentimetres(round(layout.groupTop)) : '—'} />
      </div>

      <div className="mt-4 text-sm leading-relaxed text-neutral-800" role="status" aria-live="polite" aria-atomic="true">
        <p className="font-medium">{statusCopy}</p>
        {sofaAdvice && (
          <p className="mt-1 text-neutral-700">
            Above a sofa, leave 15 to 25 cm between its back and the lowest frame.{' '}
            <button type="button" onClick={() => setCentreInput(String(sofaCentre))} className="border-b border-neutral-900 font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              Raise the centre to {sofaCentre} cm
            </button>
          </p>
        )}
        {orderMessage && <p className="mt-1 text-neutral-700">{orderMessage}</p>}
      </div>

      {/* ------------------------------------------------- hanging plan */}
      {printCount > 0 && (
        <details className="mt-5 border-t border-neutral-300 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-900">Hanging plan — where each frame goes</summary>
          <p className="mt-2 text-xs text-neutral-600">Measure from the left edge of the wall and up from the floor. Frames usually hang 3 to 5 cm below their hook, so check yours before you mark.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-neutral-600">
                  <th className="py-1.5 pr-3 font-medium">Print</th>
                  <th className="py-1.5 pr-3 font-medium">Size</th>
                  <th className="py-1.5 pr-3 font-medium">Left edge</th>
                  <th className="py-1.5 font-medium">Top edge from floor</th>
                </tr>
              </thead>
              <tbody className="text-neutral-800">
                {layout.prints.map(placed => (
                  <tr key={displayRows[placed.row][placed.index].id} className="border-t border-neutral-200">
                    <td className="py-1.5 pr-3">Row {placed.row + 1}, print {placed.index + 1}</td>
                    <td className="py-1.5 pr-3">{PRINT_SIZES[placed.size].label.split(',')[0]}</td>
                    <td className="py-1.5 pr-3">{formatCentimetres(round(placed.left))}</td>
                    <td className="py-1.5">{formatCentimetres(round(placed.topFromFloor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => copy('plan')} className="min-h-10 rounded-md border border-neutral-900 px-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {copied === 'plan' ? 'Copied' : 'Copy the plan'}
            </button>
            <button type="button" onClick={() => copy('link')} className="min-h-10 rounded-md border border-neutral-300 px-3 text-sm text-neutral-800 transition-colors hover:border-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {copied === 'link' ? 'Link copied' : 'Copy a link to this wall'}
            </button>
          </div>
        </details>
      )}

      <p className="mt-6 text-sm text-neutral-700">
        {shoppingList ? <>For this wall you need {shoppingList}. </> : null}
        Frames add a little to each edge, so measure their outside before fixing any hooks.
      </p>
      <TrackedLink event="gallery-wall-calculator-products-click" eventData={{ article: 'create-an-art-wall' }} href={`${localePrefix}/products`} className="mt-2 inline-flex min-h-11 items-center border-b border-neutral-900 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
        Find the prints for it <span aria-hidden="true" className="ml-1">→</span>
      </TrackedLink>
    </section>
  );
}

const round = (value: number) => Math.round(value * 2) / 2;

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'bad' }) {
  return (
    <div className="py-4 first:pr-4 sm:px-4 sm:first:pl-0 sm:last:pr-0">
      <span className="block text-xs uppercase tracking-wide text-neutral-600">{label}</span>
      <strong className={`mt-1 block text-xl font-medium tabular-nums ${tone === 'bad' ? 'text-destructive' : 'text-neutral-900'}`}>{value}</strong>
    </div>
  );
}

/**
 * A dimension line, drawn the way a plan draws one: a thin rule with a tick at
 * each end and the measurement written on it. `from`/`to` are centimetres
 * along the axis, `at` is the position across it, both in wall coordinates.
 */
function Dimension({
  axis, from, to, at, label, x, y, w, h, transition, labelSide = 'right', className = '',
}: {
  className?: string;
  axis: 'x' | 'y';
  from: number;
  to: number;
  at: number;
  label: string;
  labelSide?: 'left' | 'right';
  x: (cm: number) => string;
  y: (cm: number) => string;
  w?: (cm: number) => string;
  h?: (cm: number) => string;
  transition: string;
}) {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  if (hi - lo <= 0) return null;
  const tick = 'absolute bg-neutral-400';
  if (axis === 'x') {
    return (
      <div className="pointer-events-none absolute flex items-center justify-center" style={{ left: x(lo), width: w?.(hi - lo), top: y(at), height: 0, transition }}>
        <div className="absolute inset-x-0 top-0 border-t border-neutral-400" />
        <div className={`${tick} left-0 h-2 w-px -translate-y-1/2`} />
        <div className={`${tick} right-0 h-2 w-px -translate-y-1/2`} />
        <span className="relative -top-[9px] bg-[#f7f6f3] px-1 text-[10px] tabular-nums text-neutral-600 sm:text-[11px]">{label}</span>
      </div>
    );
  }
  return (
    <div className={`pointer-events-none absolute flex items-center justify-center ${className}`} style={{ left: x(at), top: y(hi), height: h?.(hi - lo), width: 0, transition }}>
      <div className="absolute inset-y-0 left-0 border-l border-neutral-400" />
      <div className={`${tick} top-0 h-px w-2 -translate-x-1/2`} />
      <div className={`${tick} bottom-0 h-px w-2 -translate-x-1/2`} />
      {/* Written along the line, as a plan writes a vertical dimension, so it
          never runs across a neighbouring line or into the prints. */}
      <span
        className={`absolute whitespace-nowrap text-[10px] tabular-nums text-neutral-600 sm:text-[11px] ${labelSide === 'left' ? 'right-1' : 'left-1'}`}
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {label}
      </span>
    </div>
  );
}
