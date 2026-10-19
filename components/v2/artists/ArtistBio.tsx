'use client';

import { useEffect, useId, useRef, useState } from 'react';

// An artist bio clamped to three lines with a quiet "Show more" (Mark,
// 19 Oct 2026: Patrik Wennerlund's bio ran far too long on a phone). The whole
// text is always in the HTML; only CSS hides the overflow, so search still
// reads the full bio. The button appears only when the text really runs past
// three lines at the current width, and is re-measured when the width changes.
export function ArtistBio({
  text,
  locale,
  className = '',
}: {
  text: string;
  locale: 'en' | 'no';
  className?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, text]);

  const labels = locale === 'no' ? { more: 'Vis mer', less: 'Vis mindre' } : { more: 'Show more', less: 'Show less' };

  return (
    <div className="flex flex-col items-start gap-2">
      <p ref={ref} id={id} className={`type-body w-full ${expanded ? '' : 'line-clamp-3'} ${className}`}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(v => !v)}
          className="type-small underline transition-colors hover:text-brand"
        >
          {expanded ? labels.less : labels.more}
        </button>
      )}
    </div>
  );
}
