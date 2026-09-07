// Shared bits for talking to socialagent's journal-preview endpoints from the
// server: the preview page (fetches the draft itself) and the
// app/api/preview-comments proxy (fetches/posts its comments) both need the
// same origin and, where Vercel Deployment Protection is on for that
// deployment, the same bypass header — never called from the client, so the
// bypass token this reads never reaches a browser.
//
// Mark's own socialagent deployment, used unless overridden. Not a secret:
// it is a public preview URL, just not one we want hardcoded in two places.
const DEFAULT_SOCIALAGENT_ORIGIN = 'https://socialagent-mark-diffeys-projects.vercel.app';

export function socialagentOrigin(): string {
  return process.env.SOCIALAGENT_ORIGIN || DEFAULT_SOCIALAGENT_ORIGIN;
}

/**
 * `x-vercel-protection-bypass`, set only when SOCIALAGENT_PREVIEW_BYPASS is
 * configured. socialagent's Deployment Protection would otherwise answer
 * every server-to-server fetch with its own auth wall instead of the
 * preview JSON.
 */
export function socialagentBypassHeaders(): Record<string, string> {
  const bypass = process.env.SOCIALAGENT_PREVIEW_BYPASS;
  return bypass ? { 'x-vercel-protection-bypass': bypass } : {};
}

/** The shape GET /api/journal/preview/{token} answers with. `body` is
 *  markdown, private `[note: …]` asides already stripped by socialagent. */
export interface PreviewArticle {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image: string;
  body: string;
  updatedAt: string;
  expiresAt: string;
}

/**
 * Fetches one draft's preview payload from socialagent. Never cached
 * (`no-store`): a stale preview would show an editor a version of their own
 * unpublished draft that no longer matches what they just saved. Returns
 * null for a 404 (unknown, expired or revoked token) or any other
 * non-2xx response — the page has one response to either, `notFound()`.
 */
export async function fetchPreviewArticle(token: string): Promise<PreviewArticle | null> {
  const res = await fetch(`${socialagentOrigin()}/api/journal/preview/${encodeURIComponent(token)}`, {
    cache: 'no-store',
    headers: socialagentBypassHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}
