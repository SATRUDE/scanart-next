'use client';

import { useEffect, useRef, useState } from 'react';

// Clamp long intro copy to a couple of lines with a Read more toggle. The
// full text always ships in the served HTML (the clamp is pure CSS), so
// search engines read every word — under mobile-first indexing, collapsed
// content is weighted like visible content. Without JS the copy simply stays
// clamped; crawlers don't care and the page still reads.
export function ReadMore({
  children,
  className,
  moreLabel = 'Read more',
  lessLabel = 'Read less',
}: {
  children: React.ReactNode;
  className?: string;
  /** Localised toggle labels; default to the English strings. */
  moreLabel?: string;
  lessLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={className}>
      <div ref={ref} className={expanded ? undefined : 'line-clamp-2'}>
        {children}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="mt-2 text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
