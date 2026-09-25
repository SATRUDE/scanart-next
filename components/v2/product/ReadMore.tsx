'use client';

import { useEffect, useRef, useState } from 'react';

// The product description, clamped to three lines with a Read more toggle
// (Figma 116:409). The full text always ships in the served HTML and the clamp
// is pure CSS, so search reads every word: the catalogue description and the
// listing summary both sit inside it. Without JavaScript the copy simply stays
// clamped. Page-specific rather than components/ReadMore.tsx because the V2
// toggle is a Caption line 8 below, not the old medium-weight button.
export function ProductReadMore({
  children,
  moreLabel,
  lessLabel,
  className = '',
}: {
  children: React.ReactNode;
  moreLabel: string;
  lessLabel: string;
  className?: string;
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
    <div className={`flex flex-col items-start gap-tight ${className}`}>
      <div ref={ref} className={`${expanded ? '' : 'line-clamp-3'} [&_p+p]:mt-3`}>
        {children}
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="type-caption transition-colors hover:text-brand"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
