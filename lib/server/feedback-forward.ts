import { describeAgent, forwardConfigFromEnv } from '@/lib/server/recordings';
import type { FeedbackAnswer } from '@/lib/server/slack-feedback';

/**
 * Send one feedback answer to the Cloudflare recordings service as well, so the
 * analytics dashboard can show it beside that visit's recording (Mark,
 * 2026-11-11: "so we have it all in one place"). Same address and secret as the
 * recording chunks; the path is /v1/feedback. Never throws: Slack and the
 * socialagent row are sent regardless, and a visitor never waits on this.
 */
export async function forwardFeedback(
  answer: FeedbackAnswer,
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
  doFetch: typeof fetch = fetch,
): Promise<boolean> {
  const config = forwardConfigFromEnv(env);
  if (!config) return false;
  const country = headers.get('x-vercel-ip-country');
  const { device } = describeAgent(headers.get('user-agent') || '', answer.screenWidth);
  try {
    const res = await doFetch(new URL('/v1/feedback', config.url).href, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(4000),
      headers: { authorization: `Bearer ${config.secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        step: answer.step,
        answer: answer.answer,
        path: answer.path,
        placement: answer.placement,
        sessionId: answer.recordingId,
        device,
        country: country && /^[A-Z]{2}$/.test(country) ? country : undefined,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
