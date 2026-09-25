import type { Metadata } from 'next';
import { helpGroups } from '@/data/help';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { Button, ContentSection, PageHeader, TextLink } from '@/components/v2/ui';
import { HelpGroups, HelpJumpLinks } from '@/components/v2/help/HelpGroups';

const PAGE_TITLE = 'Help';
const PAGE_DESCRIPTION = 'Answers to common questions about ordering, delivery, returns and our prints at Scandinavian Art.';
const EMAIL = 'hello@scandinavianart.co.uk';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/help', languages: hreflangPair('/help') },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/help' }),
};

// The same data/help.ts groups render the page and this, so every question in
// the JSON-LD is also on the page with its answer in the HTML.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: helpGroups.flatMap(group =>
    group.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

export default function HelpPage() {
  return (
    <div className="page-x pb-section">
      <PageHeader
        title="Help"
        lead={
          <>
            Answers to the questions we get most. Anything else, email{' '}
            <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-brand">{EMAIL}</a>.
          </>
        }
      />
      <HelpJumpLinks groups={helpGroups} />

      <div className="mt-band desk:mt-24">
        <HelpGroups groups={helpGroups} countLabel={n => (n === 1 ? '1 question' : `${n} questions`)} />
      </div>

      <ContentSection
        id="still-stuck"
        className="mt-section"
        title="Still stuck?"
        intro={<p>Email {EMAIL}, with your order number if you have one.</p>}
        footer={
          <>
            <Button href={`mailto:${EMAIL}`}>Email us</Button>
            <TextLink href="/delivery" size="body" arrow={false}>Delivery and returns</TextLink>
            <TextLink href="/terms" size="body" arrow={false}>Terms and conditions</TextLink>
          </>
        }
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
