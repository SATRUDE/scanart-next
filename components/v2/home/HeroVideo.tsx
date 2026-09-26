'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ProductVideo } from '@/config/product-videos';
import { track } from '@/lib/analytics';

/**
 * A hero tile where the room still gives way to its light-motion clip (the
 * product page's Video 257:3920, config/product-videos.ts).
 *
 * The tile is a link, and a button cannot sit inside a link, so this is two
 * pieces sharing one video: <HeroVideo> wraps the whole card and draws the
 * pause control over the tile's bottom right, outside the link; <HeroVideoLayer>
 * goes inside the tile, over the still image. The still stays underneath as
 * the server-rendered image (the LCP candidate, docs/v2-seo.md item 7), and the
 * clip fades in only once its first frame plays.
 *
 * Same rules as the product page (WCAG 2.2.2): starts only in view, pauses out
 * of view, never restarts after the visitor pauses it, never starts on its
 * own under prefers-reduced-motion.
 */

type Ctx = {
  el: HTMLVideoElement | null;
  setEl: (el: HTMLVideoElement | null) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
};
const HeroVideoCtx = createContext<Ctx | null>(null);

export function HeroVideo({
  tileClassName,
  pauseLabel,
  playLabel,
  productName,
  children,
}: {
  /** The tile's size classes, so the control lines up with its corner. */
  tileClassName: string;
  pauseLabel: string;
  playLabel: string;
  productName: string;
  children: React.ReactNode;
}) {
  const [el, setEl] = useState<HTMLVideoElement | null>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) el.play().catch(() => {});
        else if (!entry.isIntersecting) el.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  const toggle = () => {
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      el.play().catch(() => {});
      track('product-video', { productName, action: 'play', section: 'hero' });
    } else {
      userPaused.current = true;
      el.pause();
      track('product-video', { productName, action: 'pause', section: 'hero' });
    }
  };

  return (
    <HeroVideoCtx.Provider value={{ el, setEl, playing, setPlaying: p => { setPlaying(p); if (p) setStarted(true); } }}>
      <div className="relative">
        {children}
        <div className={`pointer-events-none absolute left-0 top-0 ${tileClassName}`}>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? pauseLabel : playLabel}
            // Hidden until the clip exists, so a still tile never shows a control.
            className={`pointer-events-auto absolute right-3 bottom-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/72 backdrop-blur-[8px] transition-[background-color,opacity] duration-300 hover:bg-white ${started ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            tabIndex={started ? 0 : -1}
          >
            {playing ? (
              <svg aria-hidden width="8" height="10" viewBox="0 0 8 10" className="opacity-85">
                <rect width="3" height="10" fill="currentColor" />
                <rect x="5" width="3" height="10" fill="currentColor" />
              </svg>
            ) : (
              <svg aria-hidden width="9" height="10" viewBox="0 0 9 10" className="ml-[2px] opacity-85">
                <path d="M0 0 9 5 0 10Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </HeroVideoCtx.Provider>
  );
}

export function HeroVideoLayer({ video }: { video: ProductVideo }) {
  const ctx = useContext(HeroVideoCtx);
  const [shown, setShown] = useState(false);

  const attach = ctx?.setEl;
  const report = ctx?.setPlaying;
  if (!attach || !report) return null;
  return (
    <video
      ref={attach}
      muted
      loop
      playsInline
      preload="none"
      // The still underneath names the link; the clip is the same room moving.
      aria-hidden
      onPlaying={() => setShown(true)}
      onPlay={() => report(true)}
      onPause={() => report(false)}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${shown ? 'opacity-100' : 'opacity-0'}`}
      style={{ objectPosition: video.objectPosition }}
    >
      <source src={video.av1} type='video/mp4; codecs="av01.0.08M.10"' />
      <source src={video.h264} type="video/mp4" />
    </video>
  );
}
