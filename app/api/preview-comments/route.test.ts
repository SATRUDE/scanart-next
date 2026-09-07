import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

// No network calls: every fetch this route makes to socialagent is stubbed.
const originalEnv = { ...process.env };

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  process.env.SOCIALAGENT_ORIGIN = 'https://socialagent.test';
  delete process.env.SOCIALAGENT_PREVIEW_BYPASS;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...originalEnv };
});

describe('GET /api/preview-comments', () => {
  it('rejects a request with no token', async () => {
    const res = await GET(new Request('http://localhost/api/preview-comments'));
    expect(res.status).toBe(400);
  });

  it('proxies to the socialagent comments endpoint for that token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse([{ blockIndex: 0, name: 'Mark', comment: 'Nice line.' }])
    );

    const res = await GET(new Request('http://localhost/api/preview-comments?token=abc123'));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://socialagent.test/api/journal/preview/abc123/comments',
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ blockIndex: 0, name: 'Mark', comment: 'Nice line.' }]);
  });

  it('sends the bypass header only when SOCIALAGENT_PREVIEW_BYPASS is set', async () => {
    process.env.SOCIALAGENT_PREVIEW_BYPASS = 'shh';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]));

    await GET(new Request('http://localhost/api/preview-comments?token=abc123'));

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({ 'x-vercel-protection-bypass': 'shh' });
  });

  it('turns an upstream 404 into a 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'not-found' }, { status: 404 }));

    const res = await GET(new Request('http://localhost/api/preview-comments?token=missing'));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/preview-comments', () => {
  const validBody = { token: 'abc123', blockIndex: 2, quote: 'a line', name: 'Mark', comment: 'Nice paragraph.' };

  it('rejects invalid JSON', async () => {
    const res = await POST(new Request('http://localhost/api/preview-comments', { method: 'POST', body: '{not json' }));
    expect(res.status).toBe(400);
  });

  it('rejects a request with no token', async () => {
    const rest: Record<string, unknown> = { ...validBody };
    delete rest.token;
    const res = await POST(
      new Request('http://localhost/api/preview-comments', { method: 'POST', body: JSON.stringify(rest) })
    );
    expect(res.status).toBe(400);
  });

  it.each([
    { ...validBody, name: '' },
    { ...validBody, comment: '   ' },
    { ...validBody, blockIndex: 'two' },
  ])('rejects an incomplete payload %#', async (body) => {
    const res = await POST(new Request('http://localhost/api/preview-comments', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(400);
  });

  it('forwards a valid comment to socialagent for that token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));

    const res = await POST(
      new Request('http://localhost/api/preview-comments', { method: 'POST', body: JSON.stringify(validBody) })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://socialagent.test/api/journal/preview/abc123/comments',
      expect.objectContaining({ method: 'POST' })
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      blockIndex: 2,
      quote: 'a line',
      name: 'Mark',
      comment: 'Nice paragraph.',
    });
    expect(res.status).toBe(200);
  });

  it('trims the name and comment before forwarding', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));

    await POST(
      new Request('http://localhost/api/preview-comments', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, name: '  Mark  ', comment: '  Nice.  ' }),
      })
    );

    const [, init] = fetchMock.mock.calls[0];
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.name).toBe('Mark');
    expect(sent.comment).toBe('Nice.');
  });
});
