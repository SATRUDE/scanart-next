import type { Metadata } from 'next';
import { COPY_NO, ANSWER_LABELS_NO, Q1_ANSWERS, Q2_ANSWERS } from '@/lib/feedback';
import { socialCard } from '@/lib/site';
import { FeedbackPageForm } from '@/components/FeedbackPageForm';
import { no } from '@/lib/i18n/no';
import { noV2 } from '@/lib/i18n/no-v2-pages';
import { PageHeader } from '@/components/v2/ui';

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
    <div className="page-x pb-section">
      <PageHeader title={t.heading} lead={t.intro} locale="no" />
      <FeedbackPageForm
        q1={COPY_NO.q1}
        q2={COPY_NO.q2}
        q3={COPY_NO.q3}
        q1Answers={[...Q1_ANSWERS]}
        q2Answers={[...Q2_ANSWERS]}
        answerLabels={ANSWER_LABELS_NO}
        sendLabel={COPY_NO.send}
        thanks={COPY_NO.thanks}
        optionalLabel={noV2.feedback.optional}
      />
    </div>
  );
}
