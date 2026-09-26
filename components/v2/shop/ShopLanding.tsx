import React from 'react';
import { ContentSection, Question } from '@/components/v2/ui';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { ShopGrid } from '@/components/v2/shop/ShopGrid';
import type { CrossLinksStrings } from '@/lib/i18n';
import type { Product } from '@/contexts/CartContext';

type CrossLinksCurrent = React.ComponentProps<typeof LandingCrossLinks>['current'];

/**
 * A category or collection landing inside the shop frame (EN and NO). It
 * follows /products exactly: the shop layout renders the page header (H1 =
 * the landing heading, both intro paragraphs as the lead behind a CSS-only
 * Read more, the meta line) and the Filter bar, and this renders the rest:
 *
 *   1. The print grid, under an sr-only h2 so cards sit at h3.
 *   2. The page's own Content sections (styling copy, the collection extras),
 *      passed as children.
 *   3. The FAQs as Question rows: native <details>, so every answer is in the
 *      served HTML, matching the FAQPage JSON-LD word for word.
 *   4. Explore the shop, which is the landings' cross-linking and never links
 *      to the page itself.
 *
 * The wall-art and nordic-art landings are not in the Filter bar, so they keep
 * LandingTemplate and its own header.
 */
export function ShopLanding({
  locale = 'en',
  products,
  faqHeading,
  faqs,
  crossLinks,
  artists,
  jsonLd,
  children,
}: {
  locale?: 'en' | 'no';
  products: Product[];
  faqHeading: string;
  faqs: { question: string; answer: string }[];
  crossLinks: { current: CrossLinksCurrent; strings?: CrossLinksStrings };
  artists: { slug: string; name: string }[];
  jsonLd: object[];
  /** The page's Content sections between the grid and the FAQs. */
  children?: React.ReactNode;
}) {
  return (
    <>
      <ShopGrid products={products} />

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
    </>
  );
}
