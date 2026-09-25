import type React from 'react';
import { Breadcrumb, TextLink } from '@/components/v2/ui';

/**
 * Apply · 4 + 8 (Figma 221:4130 desktop, 221:4271 mobile): the breadcrumb, the
 * H1, the intro and the one-route note on 4 columns, closed by the fit check
 * under a rule ("Before you write, see who we already show."); the form on 6
 * of the other 8. Mobile stacks the two, intro first.
 */
export function ApplyLayout({
  locale,
  breadcrumb,
  title,
  intro,
  onlyRoute,
  fitCheck,
  children,
}: {
  locale: 'en' | 'no';
  breadcrumb: { label: string; href?: string }[];
  title: string;
  intro: string[];
  onlyRoute: string;
  fitCheck: { text: string; label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="page-x page-grid gap-y-block pt-10 pb-section tab:pt-block">
      <div className="col-span-full flex flex-col gap-group desk:col-span-4">
        <Breadcrumb items={breadcrumb} locale={locale} />
        <h1 className="type-h1">{title}</h1>
        {intro.map(p => (
          <p key={p} className="type-body">{p}</p>
        ))}
        <p className="type-small">{onlyRoute}</p>
        <div className="flex flex-col gap-tight border-t border-ink pt-4">
          <p className="type-small">{fitCheck.text}</p>
          <TextLink href={fitCheck.href} size="body">{fitCheck.label}</TextLink>
        </div>
      </div>
      <div className="col-span-full desk:col-span-6 desk:col-start-6">{children}</div>
    </div>
  );
}
