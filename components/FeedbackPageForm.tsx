'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { track } from '@/lib/analytics';

/**
 * The /feedback page's form. All three questions at once, unlike the corner
 * intercept's one-at-a-time: someone who came here on purpose has already
 * consented to the whole thing, so stepping them through it would be friction
 * rather than courtesy.
 *
 * Posts each answered question separately, matching the intercept, so the two
 * routes produce the same shape of record.
 */
export function FeedbackPageForm({
  q1,
  q2,
  q3,
  q1Answers,
  q2Answers,
}: {
  q1: string;
  q2: string;
  q3: string;
  q1Answers: string[];
  q2Answers: string[];
}) {
  const [a1, setA1] = useState<string | null>(null);
  const [a2, setA2] = useState<string | null>(null);
  const [a3, setA3] = useState('');
  const [sent, setSent] = useState(false);

  const send = async () => {
    const answers: { step: 'q1' | 'q2' | 'q3'; answer: string }[] = [];
    if (a1) answers.push({ step: 'q1', answer: a1 });
    if (a2) answers.push({ step: 'q2', answer: a2 });
    if (a3.trim()) answers.push({ step: 'q3', answer: a3.trim() });
    track('feedback-answer', { step: 'page', placement: 'page' });
    await Promise.all(
      answers.map(a =>
        fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...a, path: '/feedback', placement: 'page' }),
        }).catch(() => {})
      )
    );
    setSent(true);
  };

  if (sent) {
    return (
      <p className="mt-10 text-foreground">Thank you, that is genuinely useful.</p>
    );
  }

  return (
    <div className="mt-10 space-y-10">
      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">{q1}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {q1Answers.map(a => (
            <Button key={a} size="sm" variant={a1 === a ? 'default' : 'outline'} onClick={() => setA1(a)}>
              {a}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">{q2}</legend>
        <div className="mt-3 flex flex-col gap-1.5">
          {q2Answers.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setA2(a)}
              aria-pressed={a2 === a}
              className={`rounded border px-3 py-1.5 text-left text-sm ${
                a2 === a ? 'border-foreground bg-secondary text-foreground' : 'border-border text-foreground hover:bg-secondary'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">{q3}</legend>
        <Textarea className="mt-3" rows={4} value={a3} onChange={e => setA3(e.target.value)} />
      </fieldset>

      <Button onClick={send} disabled={!a1 && !a2 && !a3.trim()}>
        Send
      </Button>
    </div>
  );
}
