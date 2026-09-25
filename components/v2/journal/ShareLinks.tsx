'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

/**
 * The article meta line's share links (Figma Article 75:220): Copy link,
 * Email and Pinterest, in Caption. Email and Pinterest are plain links, so they
 * work without JavaScript; Copy link needs the clipboard, so it is the one
 * button. The Pinterest link is nofollow: it is a share action, not a
 * reference.
 */
export function ShareLinks({ url, title, image }: { url: string; title: string; image?: string }) {
  const [copied, setCopied] = useState(false);
  const pinterest = `https://www.pinterest.com/pin/create/button/?${new URLSearchParams({
    url,
    description: title,
    ...(image ? { media: image } : {}),
  })}`;
  const email = `mailto:?${new URLSearchParams({ subject: title, body: url }).toString().replace(/\+/g, '%20')}`;
  const cls = 'transition-colors hover:text-brand';

  return (
    <span className="flex items-center gap-4">
      <button
        type="button"
        className={cls}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard refused (insecure context, permissions): nothing to do */
          }
          track('article-share-click', { method: 'copy', url });
        }}
      >
        <span aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</span>
      </button>
      <a href={email} className={cls} onClick={() => track('article-share-click', { method: 'email', url })}>
        Email
      </a>
      <a
        href={pinterest}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className={cls}
        onClick={() => track('article-share-click', { method: 'pinterest', url })}
      >
        Pinterest
      </a>
    </span>
  );
}
