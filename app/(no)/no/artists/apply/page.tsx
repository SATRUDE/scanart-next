import type { Metadata } from 'next';
import { ArtistApplyForm } from '@/components/ArtistApplyForm';
import { ApplyLayout } from '@/components/v2/artists/ApplyLayout';
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
    <ApplyLayout
      locale="no"
      breadcrumb={[{ label: no.shared.artists, href: '/no/artists' }, { label: t.h1 }]}
      title={t.h1}
      intro={[t.intro, t.intro2]}
      onlyRoute={t.onlyRoute}
      fitCheck={{ text: t.seeWhoWeShow, label: t.meetTheArtists, href: '/no/artists' }}
    >
      <ArtistApplyForm copy={t} locale="no" />
    </ApplyLayout>
  );
}
