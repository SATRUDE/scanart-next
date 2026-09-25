import type { Metadata } from 'next';
import { HowItWorksBody } from '@/components/v2/artists/HowItWorksBody';
import { ArtistApplyBand } from '@/components/ArtistApplyBand';
import { COMPANY } from '@/config/company';
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

export default function NorwegianArtistHowItWorksPage() {
  return (
    <HowItWorksBody
      locale="no"
      title={t.pageTitle}
      breadcrumb={[{ label: t.breadcrumbHome, href: '/no' }, { label: t.pageTitle }]}
      lastUpdated={`${t.lastUpdatedLabel} ${t.lastUpdated}`}
      intro={t.intro}
      sections={t.sections}
    >
      <ArtistApplyBand
        className="mt-section"
        heading={t.band.heading}
        body={
          <p>
            {t.band.bodyBefore}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            {t.band.bodyAfter}
          </p>
        }
        ctaLabel={t.band.cta}
        href="/no/artists/apply"
        source="how-it-works"
        locale="no"
      />
    </HowItWorksBody>
  );
}
