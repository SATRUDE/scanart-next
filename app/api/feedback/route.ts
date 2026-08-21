import { NextResponse } from 'next/server';
import { sendSlackFeedback, validateFeedback } from '@/lib/server/slack-feedback';

/**
 * One answer, one POST. The form posts per step rather than on submit, so a
 * visitor who answers the first question and leaves has still told us
 * something, which at our volume is the difference between one data point and
 * none.
 *
 * Always answers 200 to the browser on a validated payload, even if the Slack
 * send fails: the visitor did their part and there is nothing useful to show
 * them about our webhook.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad-json' }, { status: 400 });
  }

  const result = validateFeedback(body);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    await sendSlackFeedback(result);
  } catch {
    // Swallowed deliberately, see above.
  }

  return NextResponse.json({ ok: true });
}
