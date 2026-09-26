'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

export type FooterSeason = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * The footer wordmark with the season's footage moving inside the letters
 * (brands/scandinavian-art/footer-motion.md): snow falling in winter, wood
 * anemones in spring, the sea in summer, leaves in autumn.
 *
 * CSS cannot clip a video to live text in every browser, so each frame is
 * drawn to a canvas and cut to "Scandinavian Art" in the page's own font,
 * measured from the still wordmark underneath so the two line up. The still
 * stays until the first frame is ready, then the video fades in over it.
 *
 * Loads only when the footer is near the screen, pauses off screen and in a
 * background tab, and never loads under prefers-reduced-motion or when the
 * visitor has paused it (the still stays).
 *
 * Footage: 8 s seamless loops, toned into the same darker band as the stills
 * so the letters keep 3:1 on the tint. The clips are from Wikimedia Commons
 * (CC BY / CC BY-SA, originals in brands/scandinavian-art/seasons/footage-test)
 * and ship at launch (Mark, 2026-09-26), credited at /credits and /no/credits
 * from lib/credits.ts. A new or replaced clip needs its entry there.
 */
export function WordmarkVideo({
  season,
  textRef,
  paused,
  onReady,
}: {
  season: FooterSeason;
  /** The still wordmark's text element, for font, size and position. */
  textRef: React.RefObject<HTMLElement | null>;
  paused: boolean;
  onReady: (ready: boolean) => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  // Server and first paint assume reduced motion, so nothing loads before we know.
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => true);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = near && !reduced && !paused;

  // Tell the footer to show the still whenever the video isn't drawing.
  useEffect(() => {
    if (!active) onReady(false);
  }, [active, onReady]);

  useEffect(() => {
    const v = video.current;
    const c = canvas.current;
    const text = textRef.current;
    if (!active || !v || !c || !text) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let drawn = false;
    let size = { w: 0, h: 0, dpr: 1 };

    const layout = () => {
      const box = wrap.current!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { w: box.width, h: box.height, dpr };
      c.width = Math.round(box.width * dpr);
      c.height = Math.round(box.height * dpr);
      c.style.width = `${box.width}px`;
      c.style.height = `${box.height}px`;
    };

    const draw = () => {
      if (v.readyState >= 2 && size.w > 0) {
        const cs = getComputedStyle(text);
        const fontPx = parseFloat(cs.fontSize);
        const { w, h, dpr } = size;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, w, h);
        // Cover-fit the frame to the wordmark's box.
        const vr = v.videoWidth / v.videoHeight;
        const br = w / h;
        const dw = vr > br ? h * vr : w;
        const dh = vr > br ? h : w / vr;
        ctx.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh);
        // Keep only the letters.
        ctx.globalCompositeOperation = 'destination-in';
        ctx.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
        if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing;
        ctx.textBaseline = 'alphabetic';
        const m = ctx.measureText('Scandinavian Art');
        const lineHeight = parseFloat(cs.lineHeight) || fontPx;
        const asc = m.fontBoundingBoxAscent ?? fontPx * 0.8;
        const desc = m.fontBoundingBoxDescent ?? fontPx * 0.2;
        const baseline = (lineHeight - (asc + desc)) / 2 + asc;
        const tb = text.getBoundingClientRect();
        const wb = wrap.current!.getBoundingClientRect();
        ctx.fillText('Scandinavian Art', tb.left - wb.left + parseFloat(cs.paddingLeft || '0'), tb.top - wb.top + baseline);
        ctx.globalCompositeOperation = 'source-over';
        if (!drawn) {
          drawn = true;
          onReady(true);
        }
      }
      raf = requestAnimationFrame(draw);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap.current!);
    const onVis = () => {
      if (document.hidden) v.pause();
      else void v.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    void v.play().catch(() => {});
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      v.pause();
      onReady(false);
    };
  }, [active, season, textRef, onReady]);

  return (
    <div ref={wrap} aria-hidden className="pointer-events-none absolute inset-0">
      {active && (
        <>
          <video
            key={season}
            ref={video}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute h-px w-px opacity-0"
          >
            <source src={`/video/seasons/${season}.av1.mp4`} type='video/mp4; codecs="av01.0.05M.08"' />
            <source src={`/video/seasons/${season}.h264.mp4`} type="video/mp4" />
          </video>
          <canvas ref={canvas} className="absolute left-0 top-0" />
        </>
      )}
    </div>
  );
}
