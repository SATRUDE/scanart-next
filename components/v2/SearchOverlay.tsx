'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Full-screen search (Figma: Search overlay 242:4241). A real form: it
 * submits to the catalogue's own query URL, so it works without JS as a
 * plain GET and adds no new indexable page (docs/v2-seo.md, item 8).
 *
 * Foundation version: the field and submit. Suggestions and live results
 * arrive with the search page build.
 */
export function SearchOverlay({ open, onClose, isNo }: { open: boolean; onClose: () => void; isNo: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const action = `${isNo ? '/no' : ''}/products`;

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={isNo ? 'Søk' : 'Search'} className="fixed inset-0 z-[60] overflow-y-auto bg-bg overlay-fade-in">
      <div className="page-x flex h-[60px] tab:h-[88px] items-center justify-between">
        <span className="font-serif text-[22px] leading-[28px] tab:text-[34px] tab:leading-[42px]">Scandinavian Art</span>
        <button type="button" onClick={onClose} className="type-small transition-opacity hover:opacity-60">
          {isNo ? 'Lukk' : 'Close'}
        </button>
      </div>
      <form
        action={action}
        method="get"
        role="search"
        className="page-x pt-block"
        onSubmit={e => {
          e.preventDefault();
          if (!q.trim()) return;
          onClose();
          router.push(`${action}?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <label className="flex items-end gap-4 border-b border-ink pb-3">
          <span className="sr-only-sa">{isNo ? 'Søk etter trykk, kunstnere og artikler' : 'Search prints, artists and stories'}</span>
          <input
            ref={input}
            name="q"
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={isNo ? 'Søk etter trykk, kunstnere og artikler' : 'Search prints, artists and stories'}
            className="min-w-0 flex-1 bg-transparent type-h2 outline-none placeholder:text-line-strong"
            autoComplete="off"
          />
          <button type="submit" className="type-small pb-2">{isNo ? 'Søk' : 'Search'}</button>
        </label>
      </form>
    </div>
  );
}
