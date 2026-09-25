'use client';

import { useId, useState } from 'react';
import { Button, Hairline } from '@/components/v2/ui';
import { track } from '@/lib/analytics';

/**
 * The /feedback page's form. All three questions at once, unlike the corner
 * intercept's one-at-a-time: someone who came here on purpose has already
 * consented to the whole thing, so stepping them through it would be friction
 * rather than courtesy.
 *
 * Posts each answered question separately, matching the intercept, so the two
 * routes produce the same shape of record.
 *
 * V2 styling (no frame of its own): the answers are Options (Figma 237:3674,
 * the peach hairline before the chosen one, the rest at 55%), the free text is
 * the underlined Text field (240:4537) with its word marker, and Send is the
 * section's one black Button. The markup stays buttons with aria-pressed, as
 * before.
 */
export function FeedbackPageForm({
  q1,
  q2,
  q3,
  q1Answers,
  q2Answers,
  answerLabels,
  sendLabel = 'Send',
  thanks = 'Thank you, that is genuinely useful.',
  optionalLabel = 'Optional',
}: {
  q1: string;
  q2: string;
  q3: string;
  q1Answers: string[];
  q2Answers: string[];
  /** Canonical answer -> visible label. The canonical value is still what is
   *  posted, so both trees produce comparable records. */
  answerLabels?: Record<string, string>;
  sendLabel?: string;
  thanks?: string;
  /** The Text field's word marker: none of the three questions is required. */
  optionalLabel?: string;
}) {
  const [a1, setA1] = useState<string | null>(null);
  const [a2, setA2] = useState<string | null>(null);
  const [a3, setA3] = useState('');
  const [sent, setSent] = useState(false);
  const textId = useId();

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
    return <p className="mt-block type-lead" role="status">{thanks}</p>;
  }

  const option = (value: string, selected: boolean, onClick: () => void) => (
    <button
      key={value}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="group/opt flex items-center gap-tight py-1 text-left type-body"
    >
      {selected && <Hairline />}
      <span className={selected ? '' : 'opacity-55 transition-opacity group-hover/opt:opacity-100'}>{answerLabels?.[value] ?? value}</span>
    </button>
  );

  return (
    <div className="mt-block flex flex-col gap-block tab:max-w-[624px]">
      <fieldset className="flex flex-col gap-tight border-t border-ink pt-4 tab:pt-group">
        <legend className="float-left mb-tight w-full type-small">{q1}</legend>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {q1Answers.map(a => option(a, a1 === a, () => setA1(a)))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-tight border-t border-ink pt-4 tab:pt-group">
        <legend className="float-left mb-tight w-full type-small">{q2}</legend>
        <div className="flex flex-col items-start gap-1">
          {q2Answers.map(a => option(a, a2 === a, () => setA2(a)))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-tight border-t border-ink pt-4 tab:pt-group">
        <label htmlFor={textId} className="flex items-baseline gap-3">
          <span className="type-small">{q3}</span>
          <span className="type-caption">{optionalLabel}</span>
        </label>
        <textarea
          id={textId}
          rows={3}
          value={a3}
          onChange={e => setA3(e.target.value)}
          className="min-h-[112px] w-full resize-y border-b border-ink bg-transparent pt-1.5 pb-2.5 type-body outline-none focus-visible:border-brand"
        />
      </div>

      <div>
        <Button onClick={send} disabled={!a1 && !a2 && !a3.trim()}>
          {sendLabel}
        </Button>
      </div>
    </div>
  );
}
