import React from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  // DRAFT-only banner. Remove (pass false / omit) once the wording is signed
  // off and the business details are filled in. See the three TODO_* below.
  draftNotice?: boolean;
}

// Shared layout for the legal pages (Privacy, Terms, Delivery & Returns),
// matching Stan's Figma template (node 21:2): breadcrumb, centred title +
// "Last updated", then left-aligned numbered sections in a narrow prose column.
export const LegalPage: React.FC<LegalPageProps> = ({ title, lastUpdated, sections, draftNotice }) => {
  // px-4 sm:px-6 matches the nav container (components/Header.tsx) so the
  // breadcrumb's left edge lines up with the logo.
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-neutral-900 mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          {draftNotice && (
            <p className="text-sm text-muted-foreground mt-4">
              Draft for review, final wording to be confirmed before publication.
            </p>
          )}
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="text-lg font-medium text-neutral-900 mb-2">
                {i + 1}. {section.heading}
              </h2>
              <div className="text-neutral-600 leading-relaxed space-y-3">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
