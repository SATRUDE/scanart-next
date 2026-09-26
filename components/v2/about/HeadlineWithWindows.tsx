'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export type WindowPool = 'prints' | 'homes' | 'nature';

/** One piece of the headline: words, a window, or a desktop line break. */
export type HeadlinePart = string | { window: WindowPool } | { br: true };

const HOLD = 1600;
const ROLL = 600;
const STAGGER = 400;

/** Fixed widths (Figma 241:4080): 180 / 150 / 240 at 76 px, 104 / 84 / 120 at 44 px, so the words never move. */
const WIDTH: Record<WindowPool, string> = {
  prints: 'w-[104px] tab:w-[180px]',
  homes: 'w-[84px] tab:w-[150px]',
  nature: 'w-[120px] tab:w-[240px]',
};

/**
 * Headline with windows (Figma 241:4080; About hero C, states 180:1389 to
 * 180:1498; spec in the brand file's about-hero-motion.md).
 *
 * The H1 is the sentence, word for word ("Bringing Scandinavian art into homes
 * around the world"), and search and screen readers get only that: the three
 * windows are aria-hidden with empty alts. Each window holds a snapshot for
 * 1.6 s, then the next rolls up from below inside it (600 ms), staggered 400 ms
 * left to right so the eye follows the sentence.
 *
 * The first snapshot of each window is server-rendered, so the page paints
 * complete with no script. The rest of each pool is shuffled once per visit,
 * the next image is mounted (and so loaded) below the window before it shows,
 * and the roll pauses when the tab is hidden or the hero leaves the viewport.
 * With reduced motion the first snapshots simply stay.
 */
export function HeadlineWithWindows({
  parts,
  pools,
  className = '',
}: {
  parts: HeadlinePart[];
  pools: Record<WindowPool, string[]>;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotion(!reduce.matches);
    sync();
    reduce.addEventListener('change', sync);
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVisibility);
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (ref.current) io.observe(ref.current);
    return () => {
      reduce.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
    };
  }, []);

  const running = motion && inView && pageVisible;
  let windowIndex = 0;

  return (
    <h1 ref={ref} className={`type-display ${className}`}>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <React.Fragment key={i}>{part}</React.Fragment>;
        // A desktop line break: an empty block ends the line from tablet up,
        // and on mobile the sentence wraps where it falls.
        if ('br' in part) return <span key={i} aria-hidden className="hidden tab:block" />;
        const order = windowIndex++;
        return (
          <React.Fragment key={i}>
            {' '}
            <Window pool={pools[part.window]} width={WIDTH[part.window]} delay={order * STAGGER} running={running} />{' '}
          </React.Fragment>
        );
      })}
    </h1>
  );
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function Window({ pool, width, delay, running }: { pool: string[]; width: string; delay: number; running: boolean }) {
  // The first snapshot is fixed (it is what the server rendered); the rest is
  // shuffled after hydration so server and client agree on the first paint.
  const [order, setOrder] = useState(pool);
  const [index, setIndex] = useState(0);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off shuffle after hydration; shuffling during render would differ from the server's HTML
    setOrder([pool[0], ...shuffled(pool.slice(1))]);
  }, [pool]);

  useEffect(() => {
    if (!running || order.length < 2) return;
    let rollTimer: ReturnType<typeof setTimeout> | undefined;
    let cycle: ReturnType<typeof setInterval> | undefined;
    const roll = () => {
      setRolling(true);
      rollTimer = setTimeout(() => {
        setIndex(i => i + 1);
        setRolling(false);
      }, ROLL);
    };
    const start = setTimeout(() => {
      roll();
      cycle = setInterval(roll, HOLD + ROLL);
    }, HOLD + delay);
    return () => {
      clearTimeout(start);
      if (rollTimer) clearTimeout(rollTimer);
      if (cycle) clearInterval(cycle);
      setRolling(false);
    };
  }, [running, delay, order.length]);

  const current = order[index % order.length];
  const next = order[(index + 1) % order.length];
  const layer = 'absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)]';

  // Served as they are (unoptimized): each crop is a native-resolution close-up
  // of the original scene, encoded once at high quality. Through the image
  // optimiser they were re-compressed a second time, which is what blurred them.
  return (
    <span
      aria-hidden
      className={`relative h-[0.95em] overflow-hidden bg-image-bg align-[-0.12em] [display:inline-block] ${width}`}
    >
      <span key={current} className={`${layer} ${rolling ? '-translate-y-full' : 'translate-y-0'}`}>
        <Image src={current} alt="" fill unoptimized className="object-cover" loading="eager" />
      </span>
      {order.length > 1 && (
        <span key={next} className={`${layer} ${rolling ? 'translate-y-0' : 'translate-y-full'}`}>
          <Image src={next} alt="" fill unoptimized className="object-cover" loading="eager" />
        </span>
      )}
    </span>
  );
}
