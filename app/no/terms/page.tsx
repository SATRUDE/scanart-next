import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian terms: app/terms/page.tsx translated section for section.
//
// Faithful translation only. Every obligation, period and limit is the same as
// the English page: 14 days to cancel, governing law the same, import duties on
// the buyer for orders outside COMPANY.country. Nothing is added, removed or
// softened, and no Norwegian-specific right is asserted that the English page
// does not already grant. If the English wording changes, this changes with it,
// and LAST_UPDATED is bumped by hand on both.
const PAGE_TITLE = 'Vilkår og betingelser';
const PAGE_DESCRIPTION =
  'Vilkårene Scandinavian Art selger kunsttrykk på, og som gjelder for din bruk av dette nettstedet.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/no/terms',
    languages: hreflangPair('/terms'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/no/terms', ogLocale: 'nb_NO' }),
};

// Same effective date as the English page; bump both by hand together.
const LAST_UPDATED = '12. juli 2026';

const sections: LegalSection[] = [
  {
    heading: 'Om oss og disse vilkårene',
    body: (
      <p>
        Scandinavian Art er et nettgalleri for kunsttrykk, drevet fra {COMPANY.country}
        {COMPANY.orgNr ? ` (org.nr ${COMPANY.orgNr})` : ''}, og kan kontaktes på {COMPANY.email}. Disse vilkårene
        gjelder for din bruk av dette nettstedet og for kjøp du gjør. Ved å legge inn en bestilling godtar du dem.
      </p>
    ),
  },
  {
    heading: 'Produktene våre',
    body: (
      <p>
        Trykkene våre lages på bestilling (trykkes ved behov) av produksjonspartneren vår. Fordi hvert eksemplar
        produseres individuelt, er små variasjoner i farge og finish normalt, og bilder på skjerm er veiledende
        framfor eksakte.
      </p>
    ),
  },
  {
    heading: 'Bestillinger og priser',
    body: (
      <>
        <p>
          En avtale inngås når vi bekrefter bestillingen din. Prisene vises i valutaen du har valgt og er inkludert
          eventuelle gjeldende avgifter; frakt kommer i tillegg og vises før du betaler.
        </p>
        <p>
          Oppdager vi en reell feil (for eksempel en åpenbar prisfeil), eller kan vi ikke oppfylle en bestilling, kan
          vi avslå eller kansellere den og refundere deg i sin helhet.
        </p>
      </>
    ),
  },
  {
    heading: 'Betaling',
    body: (
      <p>
        Betalinger håndteres sikkert av Stripe. Kortopplysningene dine oppgis direkte til Stripe og lagres ikke av oss.
      </p>
    ),
  },
  {
    heading: 'Levering',
    body: (
      <p>
        Vi sender over hele verden. Tidsrammer for produksjon og levering, og fraktkostnader, står på siden vår om{' '}
        <Link href="/no/delivery" className="underline hover:text-neutral-900">levering og retur</Link>. For
        bestillinger utenfor {COMPANY.country} kan det påløpe importavgifter eller toll ved ankomst, og dette er
        kjøperens ansvar.
      </p>
    ),
  },
  {
    heading: 'Angrerett og retur',
    body: (
      <p>
        Du har rett til å gå fra kjøpet innen 14 dager. Fordi varene lages på bestilling, behøver du ikke sende dem
        tilbake, vi utbetaler refusjon. Defekte, skadde, feilsendte eller tapte varer dekkes særskilt. Alle detaljer
        står på siden vår om <Link href="/no/delivery" className="underline hover:text-neutral-900">levering og retur</Link>.
      </p>
    ),
  },
  {
    heading: 'Dine lovfestede rettigheter',
    body: (
      <p>
        Ingenting i disse vilkårene påvirker de ufravikelige lovfestede rettighetene du har som forbruker i landet du
        bor i. Disse rettighetene gjelder alltid i tillegg til det som står her.
      </p>
    ),
  },
  {
    heading: 'Immaterielle rettigheter',
    body: (
      <p>
        Kunstverkene forblir kunstnernes immaterielle eiendom, og innholdet på dette nettstedet tilhører oss eller
        kunstnerne våre. Kjøp av et trykk gir deg trykket til personlig bruk; det overfører ingen opphavsrett, og
        kunstverket kan ikke reproduseres, videreselges kommersielt eller brukes uten tillatelse.
      </p>
    ),
  },
  {
    heading: 'Vårt ansvar',
    body: (
      <p>
        Vi er nøye med å beskrive og produsere trykkene våre korrekt, men i den utstrekning loven tillater det er vi
        ikke ansvarlige for indirekte tap eller tap som ikke var påregnelig. Ingenting i disse vilkårene begrenser
        ansvar som ikke kan begrenses ved lov, herunder for mangelfulle varer.
      </p>
    ),
  },
  {
    heading: 'Lovvalg',
    body: (
      <p>
        Disse vilkårene reguleres av lovgivningen i {COMPANY.country}. Dette fratar deg ikke de ufravikelige
        forbrukervernreglene i landet du bor i.
      </p>
    ),
  },
  {
    heading: 'Kontakt',
    body: <p>Spørsmål om disse vilkårene? Send en e-post til {COMPANY.email}.</p>,
  },
];

export default function NorwegianTermsPage() {
  return (
    <LegalPage
      title={PAGE_TITLE}
      lastUpdated={LAST_UPDATED}
      sections={sections}
      strings={{ home: no.shared.home, homeHref: '/no', lastUpdatedLabel: 'Sist oppdatert:' }}
    />
  );
}
