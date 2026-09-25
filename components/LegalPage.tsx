import React from 'react';
import { ContentBody, ContentSection, PageHeader } from '@/components/v2/ui';

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
  /** Anchor for the section; defaults to part-<n>. */
  id?: string;
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  /** Optional lede under the title, as the Page header's lead. */
  intro?: React.ReactNode;
  // DRAFT-only line. Remove (pass false / omit) once the wording is signed
  // off and the business details are filled in.
  draftNotice?: boolean;
  /** Localised chrome labels; default to the English strings. */
  strings?: {
    home?: string;
    homeHref?: string;
    lastUpdatedLabel?: string;
    /** Page language, for the breadcrumb's landmark label. */
    locale?: 'en' | 'no';
  };
  /** Anything after the sections (a closing Content section). */
  children?: React.ReactNode;
}

/**
 * The legal pages (Privacy, Terms) in V2. They have no V2 frame, so they take
 * the template for pages without one (docs/v2-seo.md): the Page header with the
 * visible breadcrumb and the "Last updated" date as its meta line, then one
 * Content section per clause, heading on 4 columns and the text on 6.
 *
 * The clause numbers ("1. Who we are") are gone from the headings: V2 keeps
 * serif numerals for numbered editorial sets, and a policy's headings read
 * better plain. The order is unchanged.
 *
 * Links in the clauses are never underlined (layout.md): ContentBody colours
 * them, and the `underline` the page files once carried is overridden here.
 * Lists take the V2 bullet, the brand hairline.
 */
export const LegalPage: React.FC<LegalPageProps> = ({ title, lastUpdated, sections, intro, draftNotice, strings, children }) => {
  const home = strings?.home ?? 'Home';
  const homeHref = strings?.homeHref ?? '/';
  const lastUpdatedLabel = (strings?.lastUpdatedLabel ?? 'Last updated').replace(/:\s*$/, '');
  const locale = strings?.locale ?? (homeHref.startsWith('/no') ? 'no' : 'en');

  return (
    <div className="page-x pb-section">
      <PageHeader
        title={title}
        breadcrumb={[{ label: home, href: homeHref }, { label: title }]}
        locale={locale}
        lead={intro}
        meta={[lastUpdatedLabel, lastUpdated]}
      >
        {draftNotice && (
          <p className="type-small">Draft for review, final wording to be confirmed before publication.</p>
        )}
      </PageHeader>

      <div className="mt-section flex flex-col gap-block tab:gap-32">
        {sections.map((section, i) => (
          <ContentSection key={section.heading} id={section.id ?? `part-${i + 1}`} title={section.heading}>
            <ContentBody className="[&_p+ul]:mt-4 [&_ul+p]:mt-6 [&_a]:no-underline [&_strong]:font-normal [&_ul]:!gap-tight [&_ul]:!list-none [&_ul]:!pl-0 [&_li]:relative [&_li]:pl-8 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[15px] [&_li]:before:h-px [&_li]:before:w-3 [&_li]:before:bg-brand [&_li]:before:content-['']">
              {section.body}
            </ContentBody>
          </ContentSection>
        ))}
      </div>

      {children}
    </div>
  );
};
