import React from 'react';
import { PageHeader, ContentSection, Question } from '@/components/v2/ui';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { PrintGrid } from '@/components/v2/prints/PrintGrid';
import { FromPrice } from '@/components/v2/prints/FromPrice';
import { lowestPrices } from '@/components/v2/prints/lowest-prices';
import { LandingIntro } from '@/components/v2/landing/LandingIntro';
import type { CrossLinksStrings } from '@/lib/i18n';
import type { Product } from '@/contexts/CartContext';

type CrossLinksCurrent = React.ComponentProps<typeof LandingCrossLinks>['current'];

/**
 * The landing template (category, collection, wall-art, nordic-art and their
 * /no twins). These pages have no V2 design of their own, so they take the
 * Prints page's structure (docs/v2-seo.md, item 1; Mark's call):
 *
 *   1. Page header: breadcrumb, the H1 (today's heading), both intro
 *      paragraphs as the lead behind a CSS-only Read more, and a meta line with
 *      the print count.
 *   2. The print grid, under an sr-only h2 so cards sit at h3.
 *   3. The page's own Content sections (styling or framing copy, the
 *      collection extras), passed as children.
 *   4. The FAQs as Question rows: native <details>, so every answer is in the
 *      served HTML, matching the FAQPage JSON-LD word for word.
 *   5. Explore the shop, which is the landings' cross-linking and never links
 *      to the page itself.
 *
 * Server-rendered throughout; the only client code is the print tiles' price
 * and the "from" price, which follow the country picker.
 */
export function LandingTemplate({
  locale = 'en',
  heading,
  intro,
  breadcrumb,
  products,
  countLabel,
  fromLabel,
  printsHeading,
  outOfStockLabel,
  readMoreLabel,
  readLessLabel,
  faqHeading,
  faqs,
  crossLinks,
  artists,
  jsonLd,
  children,
}: {
  locale?: 'en' | 'no';
  heading: string;
  intro: string[];
  breadcrumb: { label: string; href?: string }[];
  products: Product[];
  countLabel: string;
  fromLabel: string;
  /** The grid's sr-only h2. */
  printsHeading: string;
  outOfStockLabel?: string;
  readMoreLabel?: string;
  readLessLabel?: string;
  faqHeading: string;
  faqs: { question: string; answer: string }[];
  crossLinks: { current: CrossLinksCurrent; strings?: CrossLinksStrings };
  artists: { slug: string; name: string }[];
  jsonLd: object[];
  /** The page's Content sections between the grid and the FAQs. */
  children?: React.ReactNode;
}) {
  return (
    <div className="page-x pb-section">
      <PageHeader
        title={heading}
        breadcrumb={breadcrumb}
        locale={locale}
        lead={<LandingIntro paragraphs={intro} moreLabel={readMoreLabel} lessLabel={readLessLabel} />}
        meta={[countLabel, <FromPrice key="from" prices={lowestPrices(products)} label={fromLabel} />]}
      />

      <section aria-labelledby="prints-heading" className="mt-block">
        {/* sr-only, keeping the order h1 -> h2 -> card h3 */}
        <h2 id="prints-heading" className="sr-only-sa">{printsHeading}</h2>
        <PrintGrid products={products} locale={locale} outOfStockLabel={outOfStockLabel} />
      </section>

      {children}

      <ContentSection id="common-questions" title={faqHeading} className="mt-section">
        <div className="tab:max-w-[624px]">
          {faqs.map((faq, i) => (
            <Question key={faq.question} question={faq.question} size="small" open={i === 0}>
              <p>{faq.answer}</p>
            </Question>
          ))}
        </div>
      </ContentSection>

      <LandingCrossLinks
        current={crossLinks.current}
        strings={crossLinks.strings}
        locale={locale}
        artists={artists}
        className="mt-section"
      />

      {jsonLd.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
    </div>
  );
}
