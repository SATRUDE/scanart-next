// The "feedback" Slack message.
//
// Why Slack rather than a table: at roughly 133 sessions a month this will
// yield a handful of answers, and the whole value of them is qualitative. One
// person saying "I could not tell whether you were a real shop" is worth more
// than another thousand sessions of funnel data, and it is worth most on the
// day it arrives. So v1 puts answers where Mark will actually read them, uses
// the SLACK_WEBHOOK_URL that already exists for order notifications, and needs
// no new credential, no schema migration and no third-party script.
//
// If volume ever justifies querying rather than reading, moving to a table in
// the socialagent store is a later step and a deliberate one.

import { Q1_ANSWERS, Q2_ANSWERS } from '@/lib/feedback';

export interface FeedbackAnswer {
  /** Which question this is: answers post per STEP, not on submit, so a
   *  visitor who stops after one question still tells us something. At this
   *  volume that turns one completion rate into three. */
  step: 'q1' | 'q2' | 'q3';
  answer: string;
  /** Where they were when asked. */
  path?: string;
  /** Which placement asked: the product page or the checkout. */
  placement?: 'product' | 'checkout' | 'page';
}

/** Free text is capped rather than rejected: a long answer is a keen answer,
 *  and truncating keeps one reply from filling the channel. */
export const MAX_FREE_TEXT = 1000;

export function validateFeedback(body: unknown): FeedbackAnswer | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'not-an-object' };
  const b = body as Record<string, unknown>;
  const step = b.step;
  if (step !== 'q1' && step !== 'q2' && step !== 'q3') return { error: 'bad-step' };

  const answer = typeof b.answer === 'string' ? b.answer.trim() : '';
  if (!answer) return { error: 'empty-answer' };

  // The closed questions accept only their own options, so the channel cannot
  // be used to post arbitrary text through a field that looks constrained.
  if (step === 'q1' && !(Q1_ANSWERS as readonly string[]).includes(answer)) {
    return { error: 'q1-not-an-option' };
  }
  if (step === 'q2' && !(Q2_ANSWERS as readonly string[]).includes(answer)) {
    return { error: 'q2-not-an-option' };
  }

  const placement = b.placement;
  return {
    step,
    answer: step === 'q3' ? answer.slice(0, MAX_FREE_TEXT) : answer,
    path: typeof b.path === 'string' ? b.path.slice(0, 200) : undefined,
    placement:
      placement === 'product' || placement === 'checkout' || placement === 'page'
        ? placement
        : undefined,
  };
}

const QUESTION_LABEL: Record<FeedbackAnswer['step'], string> = {
  q1: 'Did you find what you were looking for?',
  q2: 'What stopped you buying today?',
  q3: 'Anything else',
};

export function buildSlackFeedbackMessage(a: FeedbackAnswer): Record<string, unknown> {
  const where = [a.placement, a.path].filter(Boolean).join(' · ');
  return {
    text: `Feedback: ${a.answer}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: '*Someone answered the feedback form*' } },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${QUESTION_LABEL[a.step]}*\n${a.answer}` },
      },
      ...(where
        ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: where }] }]
        : []),
    ],
  };
}

export async function sendSlackFeedback(a: FeedbackAnswer): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSlackFeedbackMessage(a)),
  });
}
