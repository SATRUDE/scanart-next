'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProductVideo as ProductVideoData } from '@/config/product-videos';
import { track } from '@/lib/analytics';

/**
 * Video 257:3920: a light-motion clip in place of the room still. Muted,
 * looping, inline, and the poster paints first, so the slot never shifts and
 * nothing heavier than the poster loads until the clip is on screen.
 *
 * WCAG 2.2.2: it moves for more than five seconds, so it carries its own
 * pause control, a 32 px round icon button 12 in from the bottom right,
 * white at 72% on an 8 px blur. Under prefers-reduced-motion it never starts
 * on its own: the poster stays with a Play control, and playing is the
 * visitor's choice.
 *
 * The <video> ships in the server HTML with preload="none" and no autoplay
 * attribute; playback starts from here once it is in view. Without
 * JavaScript it is simply the poster.
 */
export function ProductVideo({
  video,
  label,
  pauseLabel,
  playLabel,
  productName,
  className = '',
  objectPosition,
}: {
  video: ProductVideoData;
  /** The accessible name for the clip, in the page's language. */
  label: string;
  pauseLabel: string;
  playLabel: string;
  productName: string;
  className?: string;
  /** Overrides the config crop, e.g. in the lightbox where it is shown whole. */
  objectPosition?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // Once the visitor pauses, scrolling back into view never restarts it.
  const userPaused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) {
          el.play().catch(() => { /* autoplay refused: the poster and Play stay */ });
        } else if (!entry.isIntersecting) {
          el.pause();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      el.play().catch(() => {});
      track('product-video', { productName, action: 'play' });
    } else {
      userPaused.current = true;
      el.pause();
      track('product-video', { productName, action: 'pause' });
    }
  };

  return (
    <div className={`relative overflow-hidden bg-image-bg ${className}`}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={video.poster}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: objectPosition ?? video.objectPosition }}
      >
        <source src={video.av1} type='video/mp4; codecs="av01.0.08M.10"' />
        <source src={video.h264} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          toggle();
        }}
        aria-label={playing ? pauseLabel : playLabel}
        className="absolute right-3 bottom-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/72 backdrop-blur-[8px] transition-colors hover:bg-white"
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
  );
}
