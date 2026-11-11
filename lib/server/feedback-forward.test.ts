import { describe, expect, it, vi } from 'vitest';
import { forwardFeedback } from './feedback-forward';

const env = { RECORDINGS_INGEST_URL: 'https://ingest.example/v1/chunk', RECORDINGS_INGEST_SECRET: 's'.repeat(40) };
const headers = new Headers({ 'user-agent': 'Mozilla/5.0 (Linux; Android 14; SM-A146B; wv) AppleWebKit/537.36 Chrome/131 Safari/537.36 [FB_IAB/FB4A]', 'x-vercel-ip-country': 'GB' });

describe('forwardFeedback', () => {
  it('posts the answer with its recording id to /v1/feedback with the bearer secret', async () => {
    const doFetch = vi.fn(async () => new Response(null, { status: 204 }));
    const ok = await forwardFeedback({ step: 'q2', answer: 'Too expensive', path: '/product/vinkveld', placement: 'product', recordingId: '0adabda7-ca8f-43e5-bed3-15413fd263d9', screenWidth: 393 }, headers, env, doFetch as unknown as typeof fetch);
    expect(ok).toBe(true);
    const [url, init] = doFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://ingest.example/v1/feedback');
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${'s'.repeat(40)}`);
    expect(JSON.parse(String(init.body))).toMatchObject({ step: 'q2', answer: 'Too expensive', sessionId: '0adabda7-ca8f-43e5-bed3-15413fd263d9', device: 'mobile', country: 'GB' });
  });
  it('does nothing without configuration and never throws', async () => {
    expect(await forwardFeedback({ step: 'q1', answer: 'Yes' }, headers, {}, vi.fn() as unknown as typeof fetch)).toBe(false);
    expect(await forwardFeedback({ step: 'q1', answer: 'Yes' }, headers, env, (async () => { throw new Error('down'); }) as unknown as typeof fetch)).toBe(false);
  });
});
