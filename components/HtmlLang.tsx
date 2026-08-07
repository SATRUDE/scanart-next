'use client';

import { useEffect } from 'react';

/**
 * Sets <html lang> for a route subtree. Next.js renders <html> only in the
 * root layout (nested layouts cannot), so the /no layout mounts this to flip
 * the document language on client-side navigation into the Norwegian tree,
 * and restore the root layout's value on the way out. The /no layout pairs it
 * with an inline script so the served HTML is corrected before hydration too.
 */
export function HtmlLang({ lang, fallback = 'en' }: { lang: string; fallback?: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = fallback;
    };
  }, [lang, fallback]);

  return null;
}
