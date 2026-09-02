'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, LayoutGrid, Link2, Maximize2, RotateCcw, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { chromeAria } from '@/lib/i18n';
import {
  decodeArrangement,
  EYE_LEVEL_CM,
  formatCentimetres,
  PRESETS,
  PRINT_SIZES,
  type PrintSizeKey,
  type WallRow,
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
  respace,
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
/** Narrower or lower than this is not a wall this plans for; the field says so. */
const MIN_WALL_CM = 180;

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

export function GalleryWallCalculator({ locale = 'en' }: { locale?: 'en' | 'no' } = {}) {
  const aria = chromeAria[locale].wallPlanner;
  const id = useId();

  const [wallWidthInput, setWallWidthInput] = useState(String(DEFAULTS.wallWidth));
  const [wallHeightInput, setWallHeightInput] = useState(DEFAULTS.wallHeight);
  /**
   * The wall's measurements as numbers, separate from what is in the fields.
   * A field cannot refuse "1" on the way to "190", so the drawing keeps the
   * last good value while you type and the field settles when you leave it:
   * anything under the minimum becomes the minimum, silently, no error.
   */
  const [wallWidthCm, setWallWidthCm] = useState<number>(DEFAULTS.wallWidth);
  const [wallHeightCm, setWallHeightCm] = useState<number | undefined>(undefined);
  const [gapInput, setGapInput] = useState(String(DEFAULTS.gap));
  const [centre, setCentre] = useState<number>(DEFAULTS.centreHeight);
  /** The whole group being dragged up or down by its height marker. */
  const [groupDragging, setGroupDragging] = useState(false);
  /** The drawing's height, held for the length of a drag. */
  const [frozenHeight, setFrozenHeight] = useState<number | null>(null);
  /**
   * True for the moment the wall changes scale. A zoom is instant: the box
   * snaps to its new proportions, and if the prints eased to their new
   * percentages at the same time they would be stretched for the length of
   * the ease, since width and height change by different ratios.
   */
  const [zooming, setZooming] = useState(false);
  const groupDragRef = useRef<{ startY: number; startCentre: number } | null>(null);
  /** One print, centred: a wall to start from, not an arrangement to undo. */
  const [prints, setPrints] = useState<FreePrint[]>(() => seeded([{ size: '50x70', x: 0, y: 0 }]));
  const [showSofa, setShowSofa] = useState(true);
  const [sofaOpen, setSofaOpen] = useState(false);
  /** The dimension lines. Off, the drawing is just the wall and the prints. */
  const [showLines, setShowLines] = useState(true);
  /** The instrument taking the whole screen. */
  const [expanded, setExpanded] = useState(false);
  /** The arrangements dialog. */
  const [arrangementsOpen, setArrangementsOpen] = useState(false);
  const [sofaWidthInput, setSofaWidthInput] = useState(String(SOFA.width));
  const [sofaHeightInput, setSofaHeightInput] = useState(String(SOFA.height));
  const [selected, setSelected] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState('');
  const [copied, setCopied] = useState(false);
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

  const wallWidth = wallWidthCm;
  const wallHeight = wallHeightCm;
  const gap = Number(gapInput);
  const centreHeight = centre;
  const printCount = prints.length;

  const gapError = gapInput === '' ? 'Enter the gap between frames.' : !(gap >= 0) ? 'The gap can’t be less than 0 cm.' : '';
  const isValid = !gapError;

  const safeWallWidth = wallWidth;
  const safeGap = gapError ? DEFAULTS.gap : gap;
  const safeCentre = centreHeight;
  const safeWallHeight = wallHeight;
  /** The sofa's own measurements, with the typical three-seater standing in for nonsense. */
  const sofaSize = {
    width: Number(sofaWidthInput) > 0 ? Number(sofaWidthInput) : SOFA.width,
    height: Number(sofaHeightInput) > 0 ? Number(sofaHeightInput) : SOFA.height,
  };

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
  /**
   * With no wall height given, the drawing shows a typical ceiling - but never
   * one that cuts the group off. It grows to hold the COMMITTED group (never
   * the one being dragged, or the wall would move under the pointer) and is
   * frozen for the length of any drag. A given height is a fact and is drawn
   * as one: a group past it is clipped, and the verdict says so.
   */
  const committedTop = placeGroup(bounds(prints.map(rectOf)), safeWallWidth, safeCentre).topFromFloor;
  const wantedHeight = safeWallHeight ?? Math.max(TYPICAL_CEILING, Math.ceil(committedTop + 20));
  const drawHeight = frozenHeight ?? wantedHeight;
  /**
   * ONE UNIT. Everything on the wall is measured in `cqw` of the wall itself -
   * a hundredth of its rendered width - so one number, the wall's width in
   * pixels, is the scale for both axes. Heights come from the floor up. The
   * wall can then be any height the frame gives it: more wall above when the
   * frame is taller than the drawing needs, never a stretched drawing.
   */
  const cq = (cm: number) => `${(cm / drawWidth) * 100}cqw`;
  const x = cq;
  const w = cq;
  const h = cq;
  const y = (fromFloor: number) => `calc(100% - ${cq(fromFloor)})`;

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
  const tooWide = box.w > drawWidth;
  const tooTall = safeWallHeight !== undefined && box.h > safeWallHeight;
  const gapStatus = safeGap < 5 ? 'tight' : safeGap > 8 ? 'wide' : 'recommended';
  // While the group rides the pointer nothing may lag behind it; while the
  // wall changes scale nothing may ease.
  const transition = groupDragging || zooming ? 'none' : `all ${REFLOW_MS}ms ${EASE}`;

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
        setWallWidthCm(Math.max(MIN_WALL_CM, plan.wallWidth));
        setWallHeightInput(plan.wallHeight === undefined ? '' : String(plan.wallHeight));
        setWallHeightCm(plan.wallHeight === undefined ? undefined : Math.max(MIN_WALL_CM, plan.wallHeight));
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

  // Escape closes a selected print's toolbar.
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  // Full screen: the page behind must not scroll, and Escape brings it back.
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  useEffect(() => {
    if (!zooming) return;
    const timer = window.setTimeout(() => setZooming(false), 80);
    return () => window.clearTimeout(timer);
  }, [zooming]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
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
    setSelected(null);
    announce(`Print is now ${shortLabel(size)}.`);
  };

  const addPrintAt = (size: PrintSizeKey, at: { x: number; y: number }, said: string) => {
    if (printCount >= MAX_PRINTS) return;
    const [print] = fresh([{ size, x: at.x, y: at.y }]);
    commit([...prints, print]);
    announce(said);
  };

  /** Back to the one print you started with. The wall, gap and sofa are yours; they stay. */
  const reset = () => {
    setPrints(fresh([{ size: '50x70', x: 0, y: 0 }]));
    setSelected(null);
    announce('Back to one print.');
  };

  const applyPreset = (key: string) => {
    const preset = PRESETS.find(entry => entry.key === key);
    if (!preset) return;
    setPrints(fresh(fromRows(preset.rows, safeGap)));
    setSelected(null);
    setArrangementsOpen(false);
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
  const centreSnaps = (): number[] => [EYE_LEVEL_CM, ...(showSofa ? [sofaSize.height + 20 + box.h / 2] : [])];

  const moveCentreTo = (wanted: number, snapping: boolean) => {
    // Floor is a hard stop; the ceiling only when one has been given. With
    // none, the drawing simply grows to hold the group once it is let go.
    const low = box.h / 2;
    const high = safeWallHeight !== undefined ? safeWallHeight - box.h / 2 : Infinity;
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
    setFrozenHeight(drawHeight);
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
    setFrozenHeight(drawHeight);
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
    const pointerFromFloor = (wallRect.bottom - clientY) / scale;
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
    // Letting go may grow the drawing to hold the group: that is a zoom.
    const growsDrawing = safeWallHeight === undefined && Math.ceil(committedTop + 20) > drawHeight;
    if (pressRef.current) {
      setFrozenHeight(null);
      if (growsDrawing) setZooming(true);
    }
    if (groupDragRef.current) {
      groupDragRef.current = null;
      setFrozenHeight(null);
      if (growsDrawing) setZooming(true);
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
      top: wallRect.bottom - (nextOffset.topFromFloor - landed.y) * scale,
    };
    setDrag(current => (current ? { ...current, settle } : current));
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    // transitionend clears it; this is for a copy that had nowhere to travel.
    settleTimer.current = window.setTimeout(() => setDrag(null), REFLOW_MS + 80);
  };

  /* --------------------------------------------------------------- derived */

  const selectedEntry = selected ? placed.find(entry => entry.print.id === selected) ?? null : null;

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  /**
   * A measurement field for the toolbar: the unit inside the box, the label a
   * whisper above it, and - on hover or focus - a slider beneath it to drag
   * left and right, in place of the spinner arrows nobody has ever enjoyed.
   * The slider covers the range a wall is likely to be; the box takes anything.
   */
  const numberField = (
    key: string,
    label: string,
    value: string,
    onChange: (next: string) => void,
    help: string,
    error: string,
    extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {},
    scrub?: { min: number; max: number; step: number }
  ) => (
    <label className="group/field relative flex flex-col gap-1" htmlFor={`${id}-${key}`}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="relative">
        <input
          id={`${id}-${key}`}
          type="number"
          inputMode="decimal"
          value={value}
          title={help}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-${key}-help${error ? ` ${id}-${key}-error` : ''}`}
          onChange={event => onChange(event.currentTarget.value)}
          className="gw-field h-9 w-[5.75rem] rounded-md border border-neutral-300 pl-2.5 pr-8 text-sm tabular-nums text-neutral-900 transition-colors hover:border-neutral-400 focus-visible:border-neutral-900 focus-visible:outline-none aria-invalid:border-destructive"
          {...extra}
        />
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-neutral-400">cm</span>
      </span>
      {scrub && (
        <SliderPrimitive.Root
          aria-label={`${label}, drag to adjust`}
          min={scrub.min}
          max={scrub.max}
          step={scrub.step}
          value={[Math.min(scrub.max, Math.max(scrub.min, Number(value) || scrub.min))]}
          onValueChange={([next]) => onChange(String(next))}
          className="relative mt-1.5 flex h-3 w-[5.75rem] touch-none select-none items-center px-1 opacity-0 transition-opacity group-hover/field:opacity-100 group-focus-within/field:opacity-100"
        >
          <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-neutral-200">
            <SliderPrimitive.Range className="absolute h-full bg-neutral-900" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block size-3 shrink-0 cursor-ew-resize rounded-full border border-neutral-900 bg-white shadow-sm ring-neutral-900/15 transition-[box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-none" />
        </SliderPrimitive.Root>
      )}
      <span id={`${id}-${key}-help`} className="sr-only">{help}</span>
      {error && <span id={`${id}-${key}-error`} className="text-xs text-destructive">{error}</span>}
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
    <section className="not-prose scroll-mt-20" aria-labelledby={`${id}-title`}>
      <style>{`
        @keyframes gw-print-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } }
        @keyframes gw-pop-in { from { opacity: 0; transform: translate(-50%, 4px) scale(0.96); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .gw-wall * { transition: none !important; animation: none !important; } }
        .gw-field { -moz-appearance: textfield; }
        .gw-field::-webkit-inner-spin-button, .gw-field::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* The page's hero has already said what this is; the heading is for the outline. */}
      <div className="sr-only">
        <h3 id={`${id}-title`} className="text-2xl font-medium text-neutral-900">Plan your wall</h3>
        <p className="mt-2 leading-relaxed text-neutral-700">
          Your wall, to scale. Drag the prints wherever you like — they click to each other’s edges and to your gap — tap one to change its size, and slide the whole group up or down by the marker at the right. Then read the hanging measurements straight off the drawing.
        </p>
      </div>

      {/* ------------------------------------------------------ the wall */}
      {/* Expanded, this wrapper becomes the whole screen. Positioned, never
          transformed: a transformed ancestor would become the containing
          block of the fixed copy under the pointer. */}
      <div className={expanded ? 'fixed inset-0 z-50 flex flex-col bg-white p-4 sm:p-6' : ''}>
        {/* The toolbar and the drawing are one instrument: the same width,
            one border between them, so the controls read as part of the wall
            rather than a form that happens to sit above a picture. The width
            is the drawing's: as wide as the bleed allows, never taller than
            the screen less the header - a wall you have to scroll to see the
            bottom of cannot be dragged across in one movement. */}
        <div className={`mx-auto w-full ${expanded ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-3 rounded-t border border-b-0 border-neutral-300 bg-white px-4 py-3">
            {numberField('wall', 'Wall width', wallWidthInput, next => {
              setWallWidthInput(next);
              const n = Number(next);
              if (next !== '' && n >= MIN_WALL_CM) { setZooming(true); setWallWidthCm(n); }
            }, 'Just the width you can use.', '', {
              min: MIN_WALL_CM, max: 2000, step: 1,
              onBlur: () => {
                const n = Number(wallWidthInput);
                const settled = wallWidthInput === '' || !(n >= MIN_WALL_CM) ? Math.max(MIN_WALL_CM, wallWidthInput === '' ? wallWidthCm : n) : n;
                setWallWidthInput(String(settled));
                if (settled !== wallWidthCm) { setZooming(true); setWallWidthCm(settled); }
              },
            }, { min: MIN_WALL_CM, max: 500, step: 1 })}
            {numberField('height', 'Wall height', wallHeightInput, next => {
              setWallHeightInput(next);
              const n = Number(next);
              if (next === '') { setZooming(true); setWallHeightCm(undefined); }
              else if (n >= MIN_WALL_CM) { setZooming(true); setWallHeightCm(n); }
            }, 'Optional. Adds the ceiling and checks the fit.', '', {
              min: MIN_WALL_CM, max: 1000, step: 1, placeholder: '—',
              onBlur: () => {
                if (wallHeightInput === '') return;
                const settled = Math.max(MIN_WALL_CM, Number(wallHeightInput) || MIN_WALL_CM);
                setWallHeightInput(String(settled));
                if (settled !== wallHeightCm) { setZooming(true); setWallHeightCm(settled); }
              },
            }, { min: MIN_WALL_CM, max: 400, step: 1 })}
            {numberField('gap', 'Gap', gapInput, next => {
              // The wall follows the gap: what sat one gap apart sits one new
              // gap apart, and what was centred under a row stays centred.
              const wanted = Number(next);
              if (wanted >= 0 && Number.isFinite(wanted) && next !== '' && wanted !== safeGap) {
                setPrints(normalize(respace(prints, sizeOf, safeGap, wanted), sizeOf));
              }
              setGapInput(next);
            }, '5 to 8 cm. Prints click to exactly this.', gapError, { min: 0, max: 30, step: 0.5 }, { min: 0, max: 20, step: 0.5 })}
            {/* Starting arrangements: a button that opens a set of cards, each a
                small drawing of the wall it makes. Choose one and it is yours
                to pull about. */}
            <Dialog open={arrangementsOpen} onOpenChange={setArrangementsOpen}>
              <DialogTrigger asChild>
                <button type="button" className="flex h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none transition-colors hover:border-neutral-400 hover:text-neutral-900 focus-visible:border-neutral-900 sm:ml-auto">
                  <LayoutGrid aria-hidden="true" className="size-4 text-neutral-500" />
                  Arrangements
                </button>
              </DialogTrigger>
              <DialogContent className="gap-8 p-8 sm:max-w-3xl sm:p-10">
                <DialogHeader className="gap-3">
                  <DialogTitle className="text-2xl font-medium tracking-tight text-neutral-900">Start with an arrangement</DialogTitle>
                  <DialogDescription className="text-base leading-relaxed text-neutral-600">Pick one and make it yours: every print can still be moved, resized or taken away.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset.key)}
                      className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 text-left outline-none transition-[border-color,box-shadow] hover:border-neutral-900 hover:shadow-lg focus-visible:border-neutral-900 focus-visible:shadow-lg"
                    >
                      <ArrangementThumb rows={preset.rows} />
                      <span className="flex flex-col gap-1.5 px-1">
                        <span className="text-base font-medium text-neutral-900">{preset.label}</span>
                        <span className="text-sm leading-relaxed text-neutral-600">{preset.description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            {/* The wall leaves as a link - the URL carries it - and comes back the same. */}
            <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-neutral-300 bg-white text-neutral-700">
              <button type="button" onClick={copyLink} aria-label={aria.copyLink} title={aria.copyLink} className="flex w-9 items-center justify-center outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:bg-neutral-100">
                {copied ? <Check aria-hidden="true" className="size-4" /> : <Link2 aria-hidden="true" className="size-4" />}
              </button>
              <button type="button" onClick={reset} aria-label={aria.reset} title={aria.reset} className="flex w-9 items-center justify-center border-l border-neutral-300 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:bg-neutral-100">
                <RotateCcw aria-hidden="true" className="size-4" />
              </button>
            </div>
            {/* The whole screen, and the same button brings it back. */}
            <button
              type="button"
              onClick={() => setExpanded(current => !current)}
              aria-pressed={expanded}
              aria-label={expanded ? aria.collapse : aria.expand}
              title={expanded ? aria.collapse : aria.expand}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:bg-neutral-100"
            >
              {expanded ? <X aria-hidden="true" className="size-4" /> : <Maximize2 aria-hidden="true" className="size-4" />}
            </button>
          </div>
        {/* THE FRAME. A box of fixed size - the toolbar's width, the screen's
            height less the header - that never changes shape. The wall is drawn
            inside it at the scale that fits, standing on the frame's floor, so
            a wider wall or a taller group makes the art smaller rather than
            reshaping the page. The surface continues around the wall in a
            slightly deeper tone: what is beyond your wall, not less of it.
            Container-query units give the wall its size with no measuring. */}
        <div
          className={`relative flex w-full items-end justify-center overflow-hidden rounded-b border border-neutral-300 bg-[#ebeae6] ${expanded ? 'min-h-0 flex-1' : ''}`}
          // Docked, the frame leaves room for the toolbar above and the page
          // around it; expanded, it takes whatever the screen has.
          style={{ height: expanded ? undefined : 'min(68vh, 75vw)', minHeight: expanded ? undefined : '300px', containerType: 'size' }}
        >
        <div
          ref={wallRef}
          role="group"
          aria-label={aria.wall}
          onPointerMove={onWallPointerMove}
          onPointerUp={onWallPointerUp}
          onPointerCancel={onWallPointerUp}
          // A press anywhere else - the surface, another print, an add slot -
          // closes the selected print's toolbar, without taking that press
          // from whatever it was for. The selected print itself toggles on tap.
          onPointerDown={event => {
            const target = event.target as Element;
            if (target.closest('[role="toolbar"]')) return;
            if (selected && target.closest(`[data-print-id="${selected}"]`)) return;
            setSelected(null);
          }}
          className="gw-wall relative h-full select-none border-x border-neutral-400 bg-[#f7f6f3]"
          style={{
            width: `min(100cqw, calc(100cqh * ${drawWidth} / ${drawHeight}))`,
            containerType: 'inline-size',
            touchAction: 'none',
          }}
        >
          {/* floor and ceiling */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-neutral-400" />
          {/* The sofa is part of the drawing, so its controls sit on the floor
              beside where it stands: a switch for whether it is there, and its
              name, which opens its measurements. */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2" onPointerDown={event => event.stopPropagation()}>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-neutral-300 bg-white/90 pl-2 text-[11px] text-neutral-700">
              <Switch checked={showSofa} onCheckedChange={setShowSofa} aria-label={aria.sofaSwitch} className="data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-neutral-300" />
              <Popover open={sofaOpen} onOpenChange={setSofaOpen}>
                <PopoverTrigger asChild>
                  <button type="button" className="flex h-full items-center gap-1 border-l border-neutral-200 pl-2 pr-2 tabular-nums outline-none transition-colors hover:text-neutral-900 focus-visible:text-neutral-900">
                    Sofa <span className="text-neutral-400">{sofaSize.width} × {sofaSize.height}</span>
                    <ChevronDown aria-hidden="true" className={`size-3 text-neutral-400 transition-transform ${sofaOpen ? 'rotate-180' : ''}`} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" sideOffset={8} className="w-auto p-3" onPointerDown={event => event.stopPropagation()}>
                  <div className="flex items-end gap-3">
                    {numberField('sofa-w', 'Sofa width', sofaWidthInput, setSofaWidthInput, 'Arm to arm.', '', { min: 60, max: 400, step: 1 }, { min: 120, max: 320, step: 1 })}
                    {numberField('sofa-h', 'Sofa height', sofaHeightInput, setSofaHeightInput, 'Floor to the top of the back.', '', { min: 40, max: 150, step: 1 }, { min: 60, max: 110, step: 1 })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {/* The measurements can be put away, leaving the wall and the prints. */}
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-neutral-300 bg-white/90 px-2 text-[11px] text-neutral-700">
              <Switch checked={showLines} onCheckedChange={setShowLines} aria-label={aria.linesSwitch} className="data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-neutral-300" />
              Lines
            </label>
          </div>

          {/* eye level */}
          {showLines && <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-neutral-300" style={{ top: y(EYE_LEVEL_CM), transition }} />}
          {showLines && safeCentre !== EYE_LEVEL_CM && (
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
              style={{ left: x((drawWidth - sofaSize.width) / 2), width: w(sofaSize.width), height: h(sofaSize.height), transition, animation: 'gw-print-in 260ms both' }}
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
          {showLines && printCount > 0 && !tooWide && (
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
          {showLines && printCount > 0 && !tooWide && groupLeft >= 12 && (
            <Dimension axis="y" from={0} to={groupTop} at={Math.min(8, groupLeft / 2)} x={x} y={y} h={h} label={`${formatCentimetres(round(groupTop))} floor to top edge`} transition={transition} />
          )}
          {showLines && printCount > 0 && !tooWide && groupLeft >= 36 && (
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
                  // Built as one valid list: "none, box-shadow …" is not one,
                  // the browser rejects it and keeps the old ease, and the
                  // prints stretch for the length of a zoom.
                  transition: isHeld || groupDragging || zooming ? 'none' : `${transition}, box-shadow 120ms ease, border-color 120ms ease`,
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
              // Kept inside the drawing: above the print when there is room,
              // over its top edge when there is not, and never off the sides.
              style={{
                left: `clamp(110px, ${x(selectedEntry.left + selectedEntry.rect.w / 2)}, calc(100% - 110px))`,
                top: `max(6px, calc(${y(selectedEntry.topFromFloor)} - 46px))`,
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
                className="flex min-h-8 min-w-8 items-center justify-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-destructive"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </div>
        </div>
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

      </div>

      {/* Announcements for screen readers; nothing is shown. The drawing carries
          its own verdicts (a red "too wide" badge), and advice waits until we
          know what advice people want. */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{statusCopy} {orderMessage}</div>
    </section>
  );
}

/** A preset drawn small: the same geometry as the wall, on a card. */
function ArrangementThumb({ rows }: { rows: readonly WallRow[] }) {
  const prints = fromRows(rows, 6);
  const box = bounds(prints.map(rectOf));
  const pad = 24;
  return (
    <svg
      aria-hidden="true"
      viewBox={`${-pad} ${-pad} ${box.w + pad * 2} ${box.h + pad * 2}`}
      className="h-40 w-full rounded-lg bg-[#f7f6f3] text-neutral-800"
      preserveAspectRatio="xMidYMid meet"
    >
      {prints.map((print, i) => {
        const r = rectOf(print);
        return (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="white" stroke="currentColor" strokeWidth="2.5" />
            <rect x={r.x + 6} y={r.y + 6} width={r.w - 12} height={r.h - 12} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
          </g>
        );
      })}
    </svg>
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
