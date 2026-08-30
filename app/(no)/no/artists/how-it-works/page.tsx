import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { no } from '@/lib/i18n/no';

/**
 * The Norwegian mirror of /artists/how-it-works. Not optional: most of the
 * roster and most prospects are Norwegian, and this is the link Mark sends
 * them.
 *
 * Unlisted on exactly the same terms as the English page (see the note there):
 * robots noindex/nofollow, absent from app/sitemap.ts, linked from nothing,
 * and deliberately still crawlable. No hreflang pair either, since declaring
 * an alternate for a page we are asking Google not to index is noise. The two
 * versions need no hand-rolled link between them: the header's LanguagePicker
 * already finds the twin, and a literal English href inside the /no tree is
 * exactly what the guard in lib/i18n-no.test.ts exists to catch.
 */
const t = no.artistsHowItWorks;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  robots: { index: false, follow: false },
};

const sections: LegalSection[] = t.sections.map((section, i) => ({
  heading: section.heading,
  body: (
    <>
      {section.body.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {i === t.sections.length - 1 && (
        <p>
          <Link href="/no/artists/apply" className="underline hover:text-neutral-900">
            {t.applyCta}
          </Link>
        </p>
      )}
    </>
  ),
}));

export default function NorwegianArtistHowItWorksPage() {
  return (
    <LegalPage
      title={t.pageTitle}
      lastUpdated={t.lastUpdated}
      intro={<p>{t.intro}</p>}
      sections={sections}
      strings={{
        home: t.breadcrumbHome,
        homeHref: '/no',
        lastUpdatedLabel: t.lastUpdatedLabel,
      }}
    />
  );
}
