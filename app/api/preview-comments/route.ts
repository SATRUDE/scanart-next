import { NextResponse } from 'next/server';
import { socialagentBypassHeaders, socialagentOrigin } from '@/lib/server/socialagent-preview';

/**
 * Same-origin proxy for a preview draft's comments, so ReaderComments (the
 * browser) never talks to socialagent directly: no CORS setup needed there,
 * and the socialagent origin and its Deployment Protection bypass token
 * stay server-side.
 */

function upstreamUrl(token: string): string {
  return `${socialagentOrigin()}/api/journal/preview/${encodeURIComponent(token)}/comments`;
}

export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'missing-token' }, { status: 400 });
  }

  const res = await fetch(upstreamUrl(token), {
    cache: 'no-store',
    headers: socialagentBypassHeaders(),
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'upstream' }, { status: res.status === 404 ? 404 : 502 });
  }
  return NextResponse.json(await res.json());
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }

  const { token, blockIndex, quote, name, comment } = (body ?? {}) as Record<string, unknown>;
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ error: 'missing-token' }, { status: 400 });
  }
  if (
    typeof blockIndex !== 'number' ||
    typeof name !== 'string' ||
    !name.trim() ||
    typeof comment !== 'string' ||
    !comment.trim()
  ) {
    return NextResponse.json({ error: 'invalid-payload' }, { status: 400 });
  }

  const res = await fetch(upstreamUrl(token), {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...socialagentBypassHeaders() },
    body: JSON.stringify({
      blockIndex,
      quote: typeof quote === 'string' ? quote : '',
      name: name.trim(),
      comment: comment.trim(),
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'upstream' }, { status: res.status === 404 ? 404 : 502 });
  }
  return NextResponse.json(await res.json());
}
