import type { Metadata } from 'next';
import Link from 'next/link';
import { ArtistApplyForm } from '@/components/ArtistApplyForm';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian artist application: app/artists/apply/page.tsx mirrored, same
// layout and the same form component, with the copy and the form's validation
// messages taken from lib/i18n/no.ts. Like the English page it stops short of
// promising a reply, because that decision is still open.
const t = no.apply;

export const metadata: Metadata = {
  title: t.h1,
  description:
    'Et lite skandinavisk galleri for kunsttrykk som tar inn svært få kunstnere. Fortell oss om arbeidet ditt, og et menneske leser det.',
  alternates: {
    canonical: '/no/artists/apply',
    languages: hreflangPair('/artists/apply'),
  },
  ...socialCard({
    title: t.h1,
    description: 'Fortell et lite skandinavisk galleri for kunsttrykk om arbeidet ditt.',
    path: '/no/artists/apply',
    ogLocale: 'nb_NO',
  }),
};

export default function NorwegianArtistApplyPage() {
  return (
    <div className="container mx-auto px-8 py-16">
      <nav aria-label="Brødsmulesti" className="mb-10 text-sm text-muted-foreground">
        <Link href="/no/artists" className="hover:text-foreground">
          {no.shared.artists}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground">{t.h1}</span>
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
        <div className="lg:col-span-1">
          <h1 className="text-3xl text-neutral-900">{t.h1}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t.intro}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t.intro2}</p>
          <p className="mt-6 text-sm text-muted-foreground">{t.onlyRoute}</p>
        </div>

        <div className="lg:col-span-2">
          <ArtistApplyForm copy={t} locale="no" />
        </div>
      </div>
    </div>
  );
}
