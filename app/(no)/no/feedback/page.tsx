import type { Metadata } from 'next';
import { COPY_NO, ANSWER_LABELS_NO, Q1_ANSWERS, Q2_ANSWERS } from '@/lib/feedback';
import { socialCard } from '@/lib/site';
import { FeedbackPageForm } from '@/components/FeedbackPageForm';
import { no } from '@/lib/i18n/no';

// The Norwegian re-entry route, mirroring app/feedback/page.tsx. The answer
// options are passed as their canonical English values with Norwegian labels
// over the top, so a Norwegian answer and an English one land in the store as
// the same string and stay countable together.
const t = no.feedback;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: { canonical: '/no/feedback' },
  // Nothing here belongs in search results; it is a door for people already
  // on the site, reached from the footer. noindex, so no hreflang pair.
  robots: { index: false, follow: true },
  ...socialCard({
    title: t.meta.title,
    description: t.meta.socialDescription,
    path: '/no/feedback',
    ogLocale: 'nb_NO',
  }),
};

export default function NorwegianFeedbackPage() {
  return (
    <div className="container mx-auto max-w-2xl px-8 py-16">
      <h1 className="text-3xl text-neutral-900">{t.heading}</h1>
      <p className="mt-4 max-w-prose text-muted-foreground leading-relaxed">{t.intro}</p>
      <FeedbackPageForm
        q1={COPY_NO.q1}
        q2={COPY_NO.q2}
        q3={COPY_NO.q3}
        q1Answers={[...Q1_ANSWERS]}
        q2Answers={[...Q2_ANSWERS]}
        answerLabels={ANSWER_LABELS_NO}
        sendLabel={COPY_NO.send}
        thanks={COPY_NO.thanks}
      />
    </div>
  );
}
