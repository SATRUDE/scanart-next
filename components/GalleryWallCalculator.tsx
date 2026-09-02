'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import { chromeAria } from '@/lib/i18n';
import {
  decodeArrangement,
  EYE_LEVEL_CM,
  formatCentimetres,
  PRESETS,
  PRINT_SIZES,
  type PrintSizeKey,
} from '@/lib/gallery-wall-calculator';
import {
  bounds,
  decodeFree,
  encodeFree,
  fromRows,
  guidesFor,
  isClear,
  normalize,
  placeGroup,
  rectOf,
  resolve,
  type FreePrint,
  type Rect,
} from '@/lib/gallery-wall-free';

/**
 * The gallery wall planner: an elevation drawing of your wall, to scale, with
 * the prints hanging on it and the measurements written on the drawing the
 * way an architect would write them.
 *
 * The wall is the interface. Prints go wherever you put them - there are no
 * rows - and what keeps the wall tidy is MAGNETISM: a print you drag clicks to
 * its neighbours' edges and centres and to exactly one gap away from them,
 * and is never allowed closer than the gap. Tap a print to change its size,
 * add more from the slots beside the group. The drawing is projected from the
 * same numbers the hanging plan prints, so what you see is what you measure.
 *
 * The contract every interaction keeps: releasing commits exactly the place
 * the placeholder was showing. The one thing that may move on release is the
 * whole group, gliding back to centre if the drag changed its extent - a
 * deliberate, visible settle, not a rearrangement.
 */

const DEFAULTS = { wallWidth: 240, wallHeight: '', gap: 6, centreHeight: EYE_LEVEL_CM };
const MAX_PRINTS = 12;
/** The one curve everything on the wall moves with, so it all feels like one material. */
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const REFLOW_MS = 260;
/** Pointer travel before a press becomes a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 5;
/** How close, in centimetres, a print has to come to a snap line to take it. */
const SNAP_RADIUS_CM = 10;
/** A sofa for scale: a typical three-seater. */
const SOFA = { width: 200, height: 85 };
/** Stands in for the ceiling when no wall height is given. */
const TYPICAL_CEILING = 250;

/**
 * Ids for the first render come from POSITION, so the server and the client
 * hand out the same ones; a module counter the server had already advanced
 * for other requests made React find "print-5" where the client had "print-0".
 * Prints made later, on the client only, use a per-instance counter.
 */
const seeded = (prints: { size: PrintSizeKey; x: number; y: number }[]): FreePrint[] =>
  prints.map((print, i) => ({ ...print, id: `print-${i}` }));

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sizeOf = (print: FreePrint) => ({ w: PRINT_SIZES[print.size].width, h: PRINT_SIZES[print.size].height });
const round = (value: number) => Math.round(value * 2) / 2;
const shortLabel = (size: PrintSizeKey) => PRINT_SIZES[size].label.split(',')[0];

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
  const [centre, setCentre] = useState<number>(DEFAULTS.centreHeight);
  /** The whole group being dragged up or down by its height marker. */
  const [groupDragging, setGroupDragging] = useState(false);
  const groupDragRef = useRef<{ startY: number; startCentre: number } | null>(null);
  const [prints, setPrints] = useState<FreePrint[]>(() => seeded(fromRows(PRESETS[2].rows, DEFAULTS.gap)));
  const [showSofa, setShowSofa] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState('');
  const [copied, setCopied] = useState<'plan' | 'link' | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const nextId = useRef(0);
  const fresh = (source: { size: PrintSizeKey; x: number; y: number }[]): FreePrint[] =>
    source.map(print => ({ ...print, id: `print-c${nextId.current++}` }));

  /**
   * A drag in flight. `rect` is where the held print WILL land, in group
   * space, already snapped and already clear of everything; the wall renders
   * it there as a placeholder, so releasing has nothing to decide.
   *
   * `offset` is where the group sat when the drag began, and is held for the
   * whole gesture: the group re-centres itself around whatever it contains,
   * and letting it do that under a moving pointer makes the pointer's own
   * position shift with every move - a feedback loop, not a feel.
   */
  const [drag, setDrag] = useState<{
    id: string;
    rect: Rect;
    offset: { left: number; topFromFloor: number };
    guides: { xs: number[]; ys: number[] };
    pointer: { x: number; y: number };
    grab: { x: number; y: number };
    size: { width: number; height: number };
    /** Set on release: the copy glides here, then the slot takes over. */
    settle: { left: number; top: number } | null;
  } | null>(null);

  const wallRef = useRef<HTMLDivElement | null>(null);
  /**
   * A press that has not yet become a drag. pointerdown records it; the first
   * move past DRAG_THRESHOLD_PX turns it into `drag`, and a release before
   * that is a tap, which selects. A ref because pointerdown sets state
   * asynchronously and the first pointermove arrives before the state exists.
   */
  const pressRef = useRef<{
    id: string;
    start: { x: number; y: number };
    grab: { x: number; y: number };
    grabCm: { x: number; y: number };
    size: { width: number; height: number };
    rect: Rect;
    offset: { left: number; topFromFloor: number };
    dragging: boolean;
  } | null>(null);
  const lastRectRef = useRef<Rect | null>(null);
  const settleTimer = useRef<number | null>(null);
  const refocusRef = useRef<string | null>(null);

  const wallWidth = Number(wallWidthInput);
  const wallHeight = wallHeightInput === '' ? undefined : Number(wallHeightInput);
  const gap = Number(gapInput);
  const centreHeight = centre;
  const printCount = prints.length;

  const wallError = wallWidthInput === '' ? 'Enter your wall width.' : !(wallWidth > 0) ? 'Use a wall width greater than 0 cm.' : '';
  const heightError = wallHeightInput !== '' && !(wallHeight !== undefined && wallHeight > 0) ? 'Use a height greater than 0 cm, or leave it blank.' : '';
  const gapError = gapInput === '' ? 'Enter the gap between frames.' : !(gap >= 0) ? 'The gap can’t be less than 0 cm.' : '';
  const isValid = !wallError && !heightError && !gapError;

  const safeWallWidth = wallError ? DEFAULTS.wallWidth : wallWidth;
  const safeGap = gapError ? DEFAULTS.gap : gap;
  const safeCentre = centreHeight;
  const safeWallHeight = heightError ? undefined : wallHeight;

  /**
   * The arrangement as it will be when the drag is released: the held print
   * already at its resolved place. THIS is what gets rendered and measured.
   */
  const displayPrints: readonly FreePrint[] =
    drag && !drag.settle ? prints.map(print => (print.id === drag.id ? { ...print, x: drag.rect.x, y: drag.rect.y } : print)) : prints;

  const rects = displayPrints.map(rectOf);
  const box = bounds(rects);
  const offset = drag && !drag.settle ? drag.offset : placeGroup(box, safeWallWidth, safeCentre);

  /** Every print with its real measurements: left edge from the wall's left, top edge from the floor. */
  const placed = displayPrints.map((print, i) => ({
    print,
    rect: rects[i],
    left: offset.left + rects[i].x,
    topFromFloor: offset.topFromFloor - rects[i].y,
  }));

  const drawWidth = safeWallWidth;
  const drawHeight = safeWallHeight ?? TYPICAL_CEILING;
  const x = (cm: number) => `${(cm / drawWidth) * 100}%`;
  const y = (fromFloor: number) => `${((drawHeight - fromFloor) / drawHeight) * 100}%`;
  const w = (cm: number) => `${(cm / drawWidth) * 100}%`;
  const h = (cm: number) => `${(cm / drawHeight) * 100}%`;

  const groupLeft = box.minX + offset.left;
  const groupRight = groupLeft + box.w;
  const groupTop = offset.topFromFloor - box.minY;
  const groupBottom = groupTop - box.h;
  // What is DRAWN while dragging sits at the frozen offset, so its margins
  // can be uneven or even negative. The figures and the verdict speak for
  // where the group will be once it has re-centred, which is what matters.
  const settled = placeGroup(box, safeWallWidth, safeCentre);
  const marginLeft = groupLeft;
  const marginRight = drawWidth - groupRight;
  const settledMargin = settled.left;
  const settledTop = settled.topFromFloor;
  const settledBottom = settledTop - box.h;
  const tooWide = box.w > drawWidth;
  const tooTall = safeWallHeight !== undefined && box.h > safeWallHeight;
  const gapStatus = safeGap < 5 ? 'tight' : safeGap > 8 ? 'wide' : 'recommended';
  // While the group rides the pointer nothing may lag behind it.
  const transition = groupDragging ? 'none' : `all ${REFLOW_MS}ms ${EASE}`;

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
      const text = match ? decodeURIComponent(match[1]) : '';
      const free = text ? decodeFree(text) : null;
      // Plans saved by the row-based version still open.
      const legacy = !free && text ? decodeArrangement(text) : null;
      const plan = free ?? (legacy ? { ...legacy, prints: fromRows(legacy.rows, legacy.gap) } : null);
      if (plan) {
        setWallWidthInput(String(plan.wallWidth));
        setWallHeightInput(plan.wallHeight === undefined ? '' : String(plan.wallHeight));
        setGapInput(String(plan.gap));
        setCentre(plan.centreHeight);
        setPrints(seeded(normalize(plan.prints, p => ({ w: PRINT_SIZES[p.size].width, h: PRINT_SIZES[p.size].height }))));
      }
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hydrated || !isValid || drag) return;
    const encoded = encodeFree({ wallWidth, wallHeight, gap, centreHeight, prints });
    const next = `#plan=${encodeURIComponent(encoded)}`;
    if (window.location.hash !== next) window.history.replaceState(null, '', next);
  }, [hydrated, isValid, drag, wallWidth, wallHeight, gap, centreHeight, prints]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    const target = refocusRef.current;
    if (!target) return;
    refocusRef.current = null;
    wallRef.current?.querySelector<HTMLElement>(`[data-print-id="${target}"]`)?.focus();
  }, [prints]);

  useEffect(() => () => { if (settleTimer.current) window.clearTimeout(settleTimer.current); }, []);

  /* ---------------------------------------------------------------- edits */

  const announce = (message: string) => setOrderMessage(message);
  const commit = (next: FreePrint[]) => setPrints(normalize(next, sizeOf));
  const othersOf = (printId: string, source: readonly FreePrint[] = prints) => source.filter(p => p.id !== printId).map(rectOf);

  const removePrint = (printId: string) => {
    commit(prints.filter(print => print.id !== printId));
    if (selected === printId) setSelected(null);
    announce('Print removed.');
  };

  const setSize = (printId: string, size: PrintSizeKey) => {
    const current = prints.find(print => print.id === printId);
    if (!current || current.size === size) return;
    const others = othersOf(printId);
    const wanted = rectOf({ ...current, size });
    // Grown into a neighbour? Slide to the nearest clear place; failing that,
    // to the end of the group.
    const clear = isClear(wanted, others, safeGap)
      ? wanted
      : resolve(wanted, others, safeGap, SNAP_RADIUS_CM, { ...wanted, x: box.w - box.minX + safeGap, y: 0 });
    commit(prints.map(print => (print.id === printId ? { ...print, size, x: clear.x, y: clear.y } : print)));
    announce(`Print is now ${shortLabel(size)}.`);
  };

  const addPrintAt = (size: PrintSizeKey, at: { x: number; y: number }, said: string) => {
    if (printCount >= MAX_PRINTS) return;
    const [print] = fresh([{ size, x: at.x, y: at.y }]);
    commit([...prints, print]);
    setSelected(print.id);
    announce(said);
  };

  const applyPreset = (key: string) => {
    const preset = PRESETS.find(entry => entry.key === key);
    if (!preset) return;
    setPrints(fresh(fromRows(preset.rows, safeGap)));
    setSelected(null);
    announce(`${preset.label} arrangement.`);
  };

  /** The keyboard path: a nudge, accepted only if it lands clear. */
  const nudge = (printId: string, dx: number, dy: number) => {
    const current = prints.find(print => print.id === printId);
    if (!current) return;
    const moved = { ...current, x: current.x + dx, y: current.y + dy };
    if (!isClear(rectOf(moved), othersOf(printId), safeGap)) {
      announce('That would put it closer than the gap to another print.');
      return;
    }
    commit(prints.map(print => (print.id === printId ? moved : print)));
    refocusRef.current = printId;
    announce(`Print moved ${Math.abs(dx || dy)} cm ${dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'}.`);
  };

  const onPrintKey = (event: React.KeyboardEvent, print: FreePrint) => {
    const step = event.shiftKey ? 10 : 1;
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => nudge(print.id, -step, 0),
      ArrowRight: () => nudge(print.id, step, 0),
      ArrowUp: () => nudge(print.id, 0, -step),
      ArrowDown: () => nudge(print.id, 0, step),
      Enter: () => setSelected(current => (current === print.id ? null : print.id)),
      ' ': () => setSelected(current => (current === print.id ? null : print.id)),
      Escape: () => setSelected(null),
      Delete: () => removePrint(print.id),
      Backspace: () => removePrint(print.id),
      s: () => setSize(print.id, print.size === '50x70' ? '50x50' : '50x70'),
    };
    const handler = handlers[event.key];
    if (!handler) return;
    event.preventDefault();
    handler();
  };

  /* ----------------------------------------------------------------- drag */

  /** Where the group's centre wants to click to: eye level, and clear of the sofa. */
  const centreSnaps = (): number[] => [EYE_LEVEL_CM, ...(showSofa ? [SOFA.height + 20 + box.h / 2] : [])];

  const moveCentreTo = (wanted: number, snapping: boolean) => {
    const low = box.h / 2;
    const high = drawHeight - box.h / 2;
    let next = Math.min(high, Math.max(low, wanted));
    if (snapping) for (const target of centreSnaps()) if (Math.abs(next - target) < 3) next = target;
    // Whole centimetres. Half steps made the readout churn twice as fast as
    // the hand moved, which read as a glitch rather than a measurement.
    setCentre(Math.round(next));
  };

  const onMarkerPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || printCount === 0) return;
    event.preventDefault();
    event.stopPropagation();
    groupDragRef.current = { startY: event.clientY, startCentre: safeCentre };
    setGroupDragging(true);
    setSelected(null);
    wallRef.current?.setPointerCapture(event.pointerId);
  };

  const onMarkerKey = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 1;
    const delta = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
    if (!delta) return;
    event.preventDefault();
    moveCentreTo(safeCentre + delta, false);
    announce(`Group centre ${formatCentimetres(Math.round(safeCentre + delta))} from the floor.`);
  };

  const pxPerCm = () => {
    const rect = wallRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? rect.width / drawWidth : 1;
  };

  const onPrintPointerDown = (event: React.PointerEvent<HTMLElement>, print: FreePrint) => {
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
    const scale = pxPerCm();
    pressRef.current = {
      id: print.id,
      start: { x: event.clientX, y: event.clientY },
      grab: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      grabCm: { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale },
      size: { width: rect.width, height: rect.height },
      rect: rectOf(print),
      offset,
      dragging: false,
    };
    lastRectRef.current = rectOf(print);
    // Captured on the WALL, not the print: the wall is there for the whole
    // gesture, whatever happens to the print's node.
    wallRef.current?.setPointerCapture(event.pointerId);
  };

  const onWallPointerMove = (event: React.PointerEvent) => {
    const wall = wallRef.current;
    const group = groupDragRef.current;
    if (group && wall) {
      const scale = wall.getBoundingClientRect().width / drawWidth;
      moveCentreTo(group.startCentre - (event.clientY - group.startY) / scale, true);
      return;
    }
    const press = pressRef.current;
    if (!press || !wall) return;
    const { clientX, clientY } = event;

    if (!press.dragging) {
      if (Math.hypot(clientX - press.start.x, clientY - press.start.y) < DRAG_THRESHOLD_PX) return;
      press.dragging = true;
      setSelected(null);
      setDrag({
        id: press.id,
        rect: press.rect,
        offset: press.offset,
        guides: { xs: [], ys: [] },
        pointer: { x: clientX, y: clientY },
        grab: press.grab,
        size: press.size,
        settle: null,
      });
      return;
    }

    /**
     * Pointer to group space through the wall's rect - the only measurement
     * taken from the DOM. Then the model decides: snap, refuse overlap, slide
     * round a neighbour if the pointer is over one, else stay where it was.
     */
    const wallRect = wall.getBoundingClientRect();
    const scale = wallRect.width / drawWidth;
    const pointerCmX = (clientX - wallRect.left) / scale;
    const pointerFromFloor = drawHeight - (clientY - wallRect.top) / scale;
    const proposed: Rect = {
      ...press.rect,
      x: pointerCmX - press.offset.left - press.grabCm.x,
      y: press.offset.topFromFloor - pointerFromFloor - press.grabCm.y,
    };
    const others = othersOf(press.id);
    const rect = resolve(proposed, others, safeGap, SNAP_RADIUS_CM, lastRectRef.current ?? press.rect);
    lastRectRef.current = rect;
    const guides = guidesFor(rect, others);
    setDrag(current => (current ? { ...current, rect, guides, pointer: { x: clientX, y: clientY } } : current));
  };

  const onWallPointerUp = () => {
    if (groupDragRef.current) {
      groupDragRef.current = null;
      setGroupDragging(false);
      announce(`Group centre ${formatCentimetres(safeCentre)} from the floor.`);
      return;
    }
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;

    if (!press.dragging) {
      setSelected(current => (current === press.id ? null : press.id));
      return;
    }
    if (!drag) return;

    // The placeholder IS the result: commit exactly what it shows. The group
    // then re-centres around its new extent, everything gliding together.
    const next = normalize(displayPrints, sizeOf);
    setPrints(next);
    const moved = press.rect.x !== drag.rect.x || press.rect.y !== drag.rect.y;
    if (moved) {
      const landed = next.find(print => print.id === drag.id);
      if (landed) announce(`Print moved to ${formatCentimetres(round(landed.x))} across, ${formatCentimetres(round(landed.y))} down the group.`);
    }

    // The copy glides to where the print will be AFTER the re-centre, so the
    // two arrive together and the drop reads as the print settling.
    const wall = wallRef.current;
    const landed = next.find(print => print.id === drag.id);
    if (!wall || !landed || reducedMotion()) {
      setDrag(null);
      return;
    }
    const nextOffset = placeGroup(bounds(next.map(rectOf)), safeWallWidth, safeCentre);
    const wallRect = wall.getBoundingClientRect();
    const scale = wallRect.width / drawWidth;
    const settle = {
      left: wallRect.left + (nextOffset.left + landed.x) * scale,
      top: wallRect.top + (drawHeight - (nextOffset.topFromFloor - landed.y)) * scale,
    };
    setDrag(current => (current ? { ...current, settle } : current));
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    // transitionend clears it; this is for a copy that had nowhere to travel.
    settleTimer.current = window.setTimeout(() => setDrag(null), REFLOW_MS + 80);
  };

  /* --------------------------------------------------------------- derived */

  const selectedEntry = selected ? placed.find(entry => entry.print.id === selected) ?? null : null;

  const counts = displayPrints.reduce<Partial<Record<PrintSizeKey, number>>>((acc, print) => ({ ...acc, [print.size]: (acc[print.size] ?? 0) + 1 }), {});
  const shoppingList = (Object.keys(PRINT_SIZES) as PrintSizeKey[])
    .filter(size => counts[size])
    .map(size => `${counts[size]} × ${shortLabel(size)}`)
    .join(' and ');

  const statusCopy = !isValid
    ? 'Complete the measurements above to see your plan.'
    : printCount === 0
      ? 'Add a print to begin.'
      : tooTall
        ? `${formatCentimetres(round(box.h - (safeWallHeight ?? 0)))} too tall for the wall. Move a print beside another, or take one away.`
        : tooWide
          ? `${formatCentimetres(round(box.w - drawWidth))} too wide for the wall. Move a print above or below another, or take one away.`
          : settledMargin === 0
            ? 'Exactly the width of the wall, with nothing to spare. Give it some breathing room before you drill.'
            : settledMargin < safeGap
              ? 'It fits, but only just. Check switches, corners and furniture before you hang.'
              : gapStatus === 'tight'
                ? 'It fits. The frames may feel cramped at this gap; 5 to 8 cm usually reads best.'
                : gapStatus === 'wide'
                  ? 'It fits. At this gap the frames may start to feel separate; 5 to 8 cm usually reads best.'
                  : 'That fits comfortably, with room around the group.';

  // The drawing is honest about a sofa: a group centred at eye level often
  // hangs BEHIND one. Say so, with the number that fixes it, in one tap.
  const sofaClearance = SOFA.height + 20;
  const sofaCentre = Math.ceil(safeCentre + (sofaClearance - settledBottom));
  const sofaAdvice = showSofa && printCount > 0 && isValid && settledBottom < sofaClearance;

  const inReadingOrder = [...placed].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);

  const planText = () => {
    const lines = [
      `Hanging plan — ${formatCentimetres(safeWallWidth)} wall, group centred ${formatCentimetres(safeCentre)} from the floor`,
      '',
    ];
    inReadingOrder.forEach((entry, i) => {
      lines.push(`Print ${i + 1}, ${shortLabel(entry.print.size)}: left edge ${formatCentimetres(round(entry.left))} from the left, top edge ${formatCentimetres(round(entry.topFromFloor))} from the floor`);
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

  /**
   * Where a print can be added: on any side of any print, the same size as
   * that print and flush with its edge, one gap away. A spot another print
   * already occupies is not offered. A spot that is free but would carry the
   * group past the wall once it re-centres IS offered, flagged, because
   * knowing that a fourth print will not fit is part of planning a wall.
   */
  type Side = 'left' | 'right' | 'above' | 'below';
  const addSpots = (() => {
    if (printCount === 0 || printCount >= MAX_PRINTS || drag || groupDragging) return [];
    const seen = new Set<string>();
    const spots: { key: string; side: Side; size: PrintSizeKey; rect: Rect; fits: boolean }[] = [];
    for (const { print, rect } of placed) {
      const sides: [Side, Rect][] = [
        ['left', { ...rect, x: rect.x - safeGap - rect.w }],
        ['right', { ...rect, x: rect.x + rect.w + safeGap }],
        ['above', { ...rect, y: rect.y - safeGap - rect.h }],
        ['below', { ...rect, y: rect.y + rect.h + safeGap }],
      ];
      for (const [side, spot] of sides) {
        const dedupe = `${print.size}:${Math.round(spot.x * 10)},${Math.round(spot.y * 10)}`;
        if (seen.has(dedupe) || !isClear(spot, rects, safeGap)) continue;
        seen.add(dedupe);
        const grown = bounds([...rects, spot]);
        const fits = grown.w <= drawWidth && safeCentre + grown.h / 2 <= drawHeight && safeCentre - grown.h / 2 >= 0;
        spots.push({ key: `${side}-${print.id}`, side, size: print.size, rect: spot, fits });
      }
    }
    return spots;
  })();

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
          Your wall, to scale. Drag the prints wherever you like — they click to each other’s edges and to your gap — tap one to change its size, and slide the whole group up or down by the marker at the right. Then read the hanging measurements straight off the drawing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
        {numberField('wall', 'Wall width', wallWidthInput, setWallWidthInput, 'Just the width you can use.', wallError, { min: 1, max: 2000, step: 1 })}
        {numberField('height', 'Wall height', wallHeightInput, setWallHeightInput, 'Optional. Adds the ceiling and checks the fit.', heightError, { min: 1, max: 1000, step: 1, placeholder: 'Optional' })}
        {numberField('gap', 'Gap between frames', gapInput, setGapInput, '5 to 8 cm. Prints click to exactly this.', gapError, { min: 0, max: 30, step: 0.5 })}
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
      {/* The drawing bleeds past the article column - half again as wide,
          within the viewport - while the text around it stays in the column.
          Done with margins, not a transform: a transformed ancestor would
          become the containing block of the fixed copy under the pointer. */}
      <div
        className="mt-5"
        style={{
          width: 'min(150%, calc(100vw - 2rem))',
          marginLeft: 'calc((100% - min(150%, calc(100vw - 2rem))) / 2)',
        }}
      >
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
            // Full width of the bleed; the height follows. A floor-to-ceiling
            // drawing of a normal wall is nearly square, so at this width it
            // can run taller than the viewport - accepted, as a picture in an
            // article does. The cap only stops a narrow wall becoming a tower.
            width: `min(100%, calc(120vh * ${drawWidth} / ${drawHeight}))`,
            minHeight: '260px',
            touchAction: 'none',
          }}
        >
          {/* floor and ceiling */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-neutral-400" />
          <span className="pointer-events-none absolute bottom-1 right-2 text-[10px] uppercase tracking-wide text-neutral-500">Floor</span>
          {safeWallHeight !== undefined && (
            <span className="pointer-events-none absolute left-2 top-1 text-[10px] uppercase tracking-wide text-neutral-500">Ceiling · {formatCentimetres(safeWallHeight)}</span>
          )}

          {/* eye level */}
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-300" style={{ top: y(EYE_LEVEL_CM), transition }} />
          {safeCentre !== EYE_LEVEL_CM && (
            <span className="pointer-events-none absolute right-2 bg-[#f7f6f3] px-1 text-[10px] tabular-nums text-neutral-500" style={{ top: `calc(${y(EYE_LEVEL_CM)} + 3px)`, transition }}>
              eye level · {EYE_LEVEL_CM} cm
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

          {/* smart guides: the lines the held print has clicked to */}
          {drag && !drag.settle && drag.guides.xs.map(gx => (
            <div key={`gx-${gx}`} className="pointer-events-none absolute inset-y-0 border-l border-dashed border-neutral-900/40" style={{ left: x(offset.left + gx) }} />
          ))}
          {drag && !drag.settle && drag.guides.ys.map(gy => (
            <div key={`gy-${gy}`} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-900/40" style={{ top: y(offset.topFromFloor - gy) }} />
          ))}

          {/* Dimensions, laid out the way a plan lays them out: one dimension
              string above the group (margin, width, margin), the verticals on
              the left where nothing else lives. Each side margin carries its
              own number, so an off-centre group during a drag shows as one. */}
          {printCount > 0 && !tooWide && (
            <>
              {marginLeft > 0 && <Dimension axis="x" from={0} to={groupLeft} at={groupTop + 10} x={x} y={y} w={w} label={formatCentimetres(round(marginLeft))} transition={transition} />}
              <Dimension axis="x" from={groupLeft} to={groupRight} at={groupTop + 10} x={x} y={y} w={w} label={formatCentimetres(round(box.w))} transition={transition} />
              {marginRight > 0 && <Dimension axis="x" from={groupRight} to={drawWidth} at={groupTop + 10} x={x} y={y} w={w} label={formatCentimetres(round(marginRight))} transition={transition} />}
            </>
          )}
          {printCount > 0 && tooWide && (
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded bg-destructive px-2 py-0.5 text-[11px] font-medium text-destructive-foreground" style={{ top: `calc(${y(groupBottom)} + 8px)` }}>
              {formatCentimetres(round(box.w - drawWidth))} too wide
            </span>
          )}
          {printCount > 0 && !tooWide && groupLeft >= 12 && (
            <Dimension axis="y" from={0} to={groupTop} at={Math.min(8, groupLeft / 2)} x={x} y={y} h={h} label={`${formatCentimetres(round(groupTop))} floor to top edge`} transition={transition} />
          )}
          {printCount > 0 && !tooWide && groupLeft >= 36 && (
            <Dimension axis="y" from={groupBottom} to={groupTop} at={groupLeft - 8} x={x} y={y} h={h} label={formatCentimetres(round(box.h))} labelSide="left" transition={transition} className="hidden sm:flex" />
          )}

          {/* the prints */}
          {placed.map(({ print, rect, left, topFromFloor }) => {
            const isHeld = drag?.id === print.id;
            const isSelected = selected === print.id;
            return (
              <div
                key={print.id}
                data-print-id={print.id}
                data-size={print.size}
                data-x={round(rect.x)}
                data-y={round(rect.y)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${shortLabel(print.size)} print. Left edge ${formatCentimetres(round(left))}, top edge ${formatCentimetres(round(topFromFloor))} from the floor.`}
                onPointerDown={event => onPrintPointerDown(event, print)}
                onKeyDown={event => onPrintKey(event, print)}
                className={`absolute box-border p-[3%] outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
                  isHeld
                    ? 'border-2 border-dashed border-neutral-400 bg-white/40'
                    : `cursor-grab border-2 bg-white ${isSelected ? 'border-neutral-900 shadow-[0_0_0_3px_rgba(23,23,23,0.12)]' : 'border-neutral-800 hover:border-neutral-900 hover:shadow-md'}`
                }`}
                style={{
                  left: x(left),
                  top: y(topFromFloor),
                  width: w(rect.w),
                  height: h(rect.h),
                  // The held placeholder jumps between snap positions; that is
                  // the point of a snap. Everything else glides.
                  transition: isHeld || groupDragging ? 'none' : `${transition}, box-shadow 120ms ease, border-color 120ms ease`,
                  animation: 'gw-print-in 220ms both',
                }}
              >
                {!isHeld && <div className="h-full w-full border border-neutral-300 bg-[#fbfaf8]" />}
              </div>
            );
          })}

          {/* Add spots: invisible until the pointer is over one, then a ghost
              of the print that would go there. Faint all the time where there
              is no hover. Red where it is free but would not fit the wall. */}
          {addSpots.map(spot => (
            <button
              key={spot.key}
              type="button"
              onClick={() => addPrintAt(spot.size, { x: spot.rect.x, y: spot.rect.y }, spot.fits ? `Print added ${spot.side === 'left' || spot.side === 'right' ? `to the ${spot.side} of` : spot.side} its neighbour.` : 'Print added, but the group no longer fits the wall.')}
              aria-label={`${aria.addSide[spot.side]}${spot.fits ? '' : ` — ${aria.wontFit}`}`}
              title={spot.fits ? undefined : aria.wontFit}
              className={`group/spot absolute flex cursor-copy items-center justify-center border border-dashed opacity-0 outline-none transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [@media(hover:none)]:opacity-30 ${spot.fits ? 'border-neutral-400 text-neutral-500' : 'border-destructive/70 text-destructive'}`}
              style={{ left: x(offset.left + spot.rect.x), top: y(offset.topFromFloor - spot.rect.y), width: w(spot.rect.w), height: h(spot.rect.h), transition }}
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              {!spot.fits && <span aria-hidden="true" className="absolute bottom-1 text-[9px] uppercase tracking-wide">won’t fit</span>}
            </button>
          ))}
          {printCount === 0 && !drag && (
            <button
              type="button"
              onClick={() => addPrintAt('50x70', { x: 0, y: 0 }, 'First print added.')}
              aria-label={aria.addFirst}
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-neutral-300 bg-[#f7f6f3] px-3 py-1 text-xs text-neutral-500 transition-colors duration-150 hover:border-neutral-700 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              style={{ top: `calc(${y(EYE_LEVEL_CM)} - 14px)` }}
            >
              <span aria-hidden="true">+</span> Add a print
            </button>
          )}

          {/* The height marker: the group's centre, as a tab on the wall's
              edge you drag up and down. While held, the distances that matter
              for hanging - to the floor, to the ceiling - are drawn. */}
          {printCount > 0 && (
            <>
              {groupDragging && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-900/40" style={{ top: y(safeCentre) }} />
                  <Dimension axis="y" from={0} to={groupBottom} at={drawWidth - 3} x={x} y={y} h={h} label={`${formatCentimetres(Math.round(groupBottom))} to floor`} labelSide="left" transition="none" />
                  {safeWallHeight !== undefined && groupTop < safeWallHeight && (
                    <Dimension axis="y" from={groupTop} to={safeWallHeight} at={drawWidth - 3} x={x} y={y} h={h} label={`${formatCentimetres(Math.round(safeWallHeight - groupTop))} to ceiling`} labelSide="left" transition="none" />
                  )}
                </>
              )}
              <button
                type="button"
                role="slider"
                aria-label={aria.heightMarker}
                aria-valuemin={Math.round(box.h / 2)}
                aria-valuemax={Math.round(drawHeight - box.h / 2)}
                aria-valuenow={Math.round(safeCentre)}
                aria-valuetext={`${formatCentimetres(safeCentre)} from the floor`}
                onPointerDown={onMarkerPointerDown}
                onKeyDown={onMarkerKey}
                title="Drag to move the whole group up or down"
                // A fixed width and whole numbers, so the tab never changes
                // shape while it moves; sitting on eye level is shown by weight,
                // not by more words.
                className={`absolute right-0 z-20 flex min-w-[4.75rem] -translate-y-1/2 cursor-ns-resize items-center justify-end gap-1 rounded-l-md border border-r-0 bg-white py-1 pl-2 pr-2.5 text-[11px] tabular-nums shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  safeCentre === EYE_LEVEL_CM
                    ? 'border-neutral-900 font-medium text-neutral-900'
                    : groupDragging
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900'
                }`}
                style={{ top: y(safeCentre), transition }}
              >
                <span aria-hidden="true" className="text-xs leading-none">⇕</span>
                {formatCentimetres(safeCentre)}
              </button>
            </>
          )}

          {/* selection toolbar */}
          {selectedEntry && !drag && (
            <div
              role="toolbar"
              aria-label={aria.selectedPrint}
              className="absolute z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
              style={{
                left: x(selectedEntry.left + selectedEntry.rect.w / 2),
                top: `calc(${y(selectedEntry.topFromFloor)} - 46px)`,
                animation: 'gw-pop-in 140ms both',
                transition,
              }}
            >
              {(Object.keys(PRINT_SIZES) as PrintSizeKey[]).map(size => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selectedEntry.print.size === size}
                  onClick={() => setSize(selectedEntry.print.id, size)}
                  className={`min-h-8 rounded-md px-2 text-xs tabular-nums transition-colors ${selectedEntry.print.size === size ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                >
                  {shortLabel(size)}
                </button>
              ))}
              <span className="mx-0.5 h-5 w-px bg-neutral-200" />
              <button
                type="button"
                onClick={() => removePrint(selectedEntry.print.id)}
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
              transition: drag.settle ? `left ${REFLOW_MS}ms ${EASE}, top ${REFLOW_MS}ms ${EASE}, transform ${REFLOW_MS}ms ${EASE}, box-shadow ${REFLOW_MS}ms ease` : 'transform 120ms ease',
              boxShadow: drag.settle ? '0 0 0 rgba(0,0,0,0)' : undefined,
            }}
          >
            <div className="h-full w-full border border-neutral-300 bg-[#fbfaf8]" />
          </div>
        )}

        <p className="mt-2 text-xs text-neutral-500">
          Drag a print anywhere; it clicks to its neighbours’ edges and centres, one gap away. Tap one to change its size or take it away. Hover beside any print, or above or below it, to add one there.
        </p>
      </div>

      {/* ------------------------------------------------------ figures */}
      <div className="mt-6 grid grid-cols-2 border-y border-neutral-300 sm:grid-cols-4 sm:divide-x sm:divide-neutral-300">
        <Figure label="Group width" value={isValid && printCount ? formatCentimetres(round(box.w)) : '—'} />
        <Figure label="Group height" value={isValid && printCount ? formatCentimetres(round(box.h)) : '—'} />
        <Figure label="Space each side" value={!isValid || !printCount ? '—' : tooWide ? 'Does not fit' : formatCentimetres(round(settledMargin))} tone={tooWide ? 'bad' : undefined} />
        <Figure label="Top edge from floor" value={isValid && printCount ? formatCentimetres(round(settledTop)) : '—'} />
      </div>

      <div className="mt-4 text-sm leading-relaxed text-neutral-800" role="status" aria-live="polite" aria-atomic="true">
        <p className="font-medium">{statusCopy}</p>
        {sofaAdvice && (
          <p className="mt-1 text-neutral-700">
            Above a sofa, leave 15 to 25 cm between its back and the lowest frame.{' '}
            <button type="button" onClick={() => setCentre(sofaCentre)} className="border-b border-neutral-900 font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
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
          <p className="mt-2 text-xs text-neutral-600">Measure from the left edge of the wall and up from the floor. Frames usually hang 3 to 5 cm below their hook, so check yours before you mark. Prints are numbered top to bottom, left to right.</p>
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
                {inReadingOrder.map((entry, i) => (
                  <tr key={entry.print.id} className="border-t border-neutral-200">
                    <td className="py-1.5 pr-3">Print {i + 1}</td>
                    <td className="py-1.5 pr-3">{shortLabel(entry.print.size)}</td>
                    <td className="py-1.5 pr-3">{formatCentimetres(round(entry.left))}</td>
                    <td className="py-1.5">{formatCentimetres(round(entry.topFromFloor))}</td>
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
      <div className={`pointer-events-none absolute flex items-center justify-center ${className}`} style={{ left: x(lo), width: w?.(hi - lo), top: y(at), height: 0, transition }}>
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
