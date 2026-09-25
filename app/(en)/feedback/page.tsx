import type { Metadata } from 'next';
import { COPY, Q1_ANSWERS, Q2_ANSWERS } from '@/lib/feedback';
import { socialCard } from '@/lib/site';
import { FeedbackPageForm } from '@/components/FeedbackPageForm';
import { PageHeader } from '@/components/v2/ui';

export const metadata: Metadata = {
  title: 'Tell us what you think',
  description:
    'Three quick questions about your visit. It helps us work out what to fix next, and a person reads every answer.',
  alternates: { canonical: '/feedback' },
  // Nothing here belongs in search results; it is a door for people already
  // on the site, reached from the footer.
  robots: { index: false, follow: true },
  ...socialCard({
    title: 'Tell us what you think',
    description: 'Three quick questions about your visit.',
    path: '/feedback',
  }),
};

/**
 * The re-entry route, and the reason the intercept can afford to be shy.
 *
 * Someone who dismissed the corner card and then hit the very thing that
 * annoyed them has nowhere to go otherwise: the card is parked for 60 days and
 * dismissal is per-device. This page is the permanent door, linked from the
 * footer, and it is a plain form that works with JavaScript off so it is also
 * the fallback for anyone the intercept never reaches.
 */
export default function FeedbackPage() {
  return (
    <div className="page-x pb-section">
      <PageHeader
        title="Tell us what you think"
        lead="Three questions, none of them required. We are a small gallery and we read every answer, so if something put you off buying we would genuinely rather know than guess."
      />
      <FeedbackPageForm q1={COPY.q1} q2={COPY.q2} q3={COPY.q3} q1Answers={[...Q1_ANSWERS]} q2Answers={[...Q2_ANSWERS]} />
    </div>
  );
}
