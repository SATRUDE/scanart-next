import type React from 'react';
import { PageHeader, ContentSection } from '@/components/v2/ui';

/**
 * /artists/how-it-works in V2. It has no V2 frame (docs/v2-seo.md, pages with
 * no V2 design), so it takes the template for those: Page header, then one
 * Content section per part of the agreement, then the apply band the pages
 * pass in as children. It used to run on LegalPage; it no longer does, so the
 * legal pages' own rebuild cannot move it by accident.
 *
 * Unlisted, and this component changes none of that: robots stay in the
 * pages' metadata and nothing here links to the page.
 */
export function HowItWorksBody({
  locale,
  title,
  breadcrumb,
  lastUpdated,
  intro,
  sections,
  children,
}: {
  locale: 'en' | 'no';
  title: string;
  breadcrumb: { label: string; href?: string }[];
  /** "Last updated: 30 August 2026" */
  lastUpdated: string;
  intro: string;
  sections: { heading: string; body: readonly string[] }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="page-x pb-section">
      <PageHeader title={title} breadcrumb={breadcrumb} locale={locale} lead={<p>{intro}</p>} meta={[lastUpdated]} />
      <div className="mt-section flex flex-col gap-block tab:gap-32">
        {sections.map((section, i) => (
          <ContentSection key={section.heading} id={`part-${i + 1}`} title={section.heading}>
            <div className="flex flex-col gap-6 type-body tab:max-w-[624px]">
              {section.body.map(paragraph => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </ContentSection>
        ))}
      </div>
      {children}
    </div>
  );
}
