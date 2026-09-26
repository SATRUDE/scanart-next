'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A row (or stack) of options where the chosen one is marked by the brand
 * hairline in front of it (Figma Option 237:3674). Every option reserves the
 * hairline's space (the `pl` below), so no word moves when the choice changes;
 * one hairline glides to the chosen option instead (350 ms, the brand ease).
 *
 * Options mark themselves with `data-option="<value>"`; `selected` says which
 * one carries the line. Used by the product Size and Frame pickers and the
 * footer's seasons.
 */
export const OPTION_PAD = 'pl-5'; // 12 px hairline + 8 px gap

export function OptionTrack({
  selected,
  children,
  className = '',
  lineClassName = '',
}: {
  selected: string;
  children: React.ReactNode;
  className?: string;
  lineClassName?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<{ x: number; y: number } | null>(null);

  const measure = useCallback(() => {
    const root = box.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-option="${CSS.escape(selected)}"]`);
    if (!el) return setMark(null);
    const r = root.getBoundingClientRect();
    const e = el.getBoundingClientRect();
    setMark({ x: e.left - r.left, y: e.top - r.top + e.height / 2 });
  }, [selected]);

  // Measured in a frame callback, after layout, rather than synchronously in
  // the effect body.
  useLayoutEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [measure]);
  useEffect(() => {
    const root = box.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    // Web fonts change the words' widths once they load.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div ref={box} className={`relative ${className}`}>
      {children}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 h-px w-3 bg-brand transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none ${mark ? 'opacity-100' : 'opacity-0'} ${lineClassName}`}
        style={mark ? { transform: `translate(${mark.x}px, ${mark.y}px)` } : undefined}
      />
    </div>
  );
}
