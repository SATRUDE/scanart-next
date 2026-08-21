import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/LegalPage';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian privacy policy: app/privacy/page.tsx translated section for
// section. Faithful translation only. Same controller, same categories of
// data, same legal bases, same processors, same retention and same supervisory
// authorities as the English page. Nothing added, removed or softened. If the
// English wording changes, this changes with it, and LAST_UPDATED is bumped by
// hand on both.
const PAGE_TITLE = 'Personvernerklæring';
const PAGE_DESCRIPTION =
  'Hvordan Scandinavian Art samler inn, bruker og beskytter personopplysningene dine.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/no/privacy',
    languages: hreflangPair('/privacy'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/no/privacy', ogLocale: 'nb_NO' }),
};

// Same effective date as the English page; bump both by hand together.
const LAST_UPDATED = '12. juli 2026';

const sections: LegalSection[] = [
  {
    heading: 'Hvem vi er',
    body: (
      <>
        <p>
          Scandinavian Art er et nettgalleri som selger kunsttrykk, drevet fra {COMPANY.country}
          {COMPANY.orgNr ? ` (org.nr ${COMPANY.orgNr})` : ''}. Vi er behandlingsansvarlig for personopplysningene
          som er beskrevet her.
        </p>
        <p>
          Du kan nå oss på {COMPANY.email}.
          {COMPANY.address ? ` Vår registrerte adresse er ${COMPANY.address}.` : ''}
        </p>
      </>
    ),
  },
  {
    heading: 'Opplysninger vi samler inn',
    body: (
      <>
        <p>Vi samler bare inn det vi trenger for å drive butikken:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Ordredetaljer</strong>: navn, e-postadresse, leveringsadresse og varene du bestiller.</li>
          <li><strong>Betaling</strong>: betalinger behandles av Stripe. Kortopplysningene dine går direkte til Stripe; vi ser eller lagrer aldri hele kortnummeret ditt.</li>
          <li><strong>Bruk av nettstedet</strong>: personvernvennlig, aggregert statistikk via Umami, som ikke bruker informasjonskapsler og ikke bygger en profil av deg.</li>
          <li><strong>Meldinger</strong>: alt du sender oss på e-post.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Hvordan og hvorfor vi bruker dem',
    body: (
      <>
        <p>Vi bruker opplysningene dine på følgende rettslige grunnlag:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>For å behandle, produsere og levere bestillingen din og gi kundeservice: for å oppfylle avtalen med deg.</li>
          <li>For å føre regnskap og skatteopplysninger: for å oppfylle våre rettslige forpliktelser.</li>
          <li>For å forstå aggregert bruk av nettstedet og holde det i gang: våre berettigede interesser.</li>
        </ul>
        <p>Vi bruker ikke opplysningene dine til markedsføring uten samtykke, og vi selger dem aldri.</p>
      </>
    ),
  },
  {
    heading: 'Informasjonskapsler',
    body: (
      <p>
        Dette nettstedet bruker ikke sporingskapsler. Statistikkverktøyet vårt (Umami) er uten informasjonskapsler, så
        vi ber deg ikke godta et cookie-banner. Skulle vi noen gang innføre informasjonskapsler, oppdaterer vi denne
        erklæringen først.
      </p>
    ),
  },
  {
    heading: 'Hvem vi deler dem med',
    body: (
      <>
        <p>Vi deler opplysningene dine kun med leverandørene vi trenger for å oppfylle bestillingen din, og der loven krever det:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Stripe</strong>: for å ta imot betaling.</li>
          <li><strong>Gelato</strong> og deres leveringspartnere: for å trykke og sende bestillingen din.</li>
          <li><strong>Slack</strong>: ordredetaljene dine sendes til teamet vårt som et ordrevarsel.</li>
        </ul>
        <p>
          Noen av disse leverandørene opererer utenfor {COMPANY.country} og EØS. Der opplysningene dine overføres til
          utlandet, er de beskyttet av egnede garantier. Vi selger aldri personopplysningene dine.
        </p>
      </>
    ),
  },
  {
    heading: 'Hvor lenge vi lagrer dem',
    body: (
      <p>
        Vi oppbevarer personopplysninger bare så lenge vi trenger dem. Vi holder ingen egen kundedatabase:
        ordre- og betalingsopplysningene dine ligger hos betalings- og trykkpartnerne våre (Stripe og Gelato) under
        deres egne retningslinjer, og så lenge vi trenger dem for å oppfylle regnskaps- og skatteforpliktelser.
        Nettstatistikken vår (Umami) er uten informasjonskapsler og aggregert, og lagres i tråd med innstillingene våre.
      </p>
    ),
  },
  {
    heading: 'Rettighetene dine',
    body: (
      <>
        <p>
          Du har rett til innsyn i, retting av, sletting av og begrensning av behandlingen av opplysningene dine, rett
          til å protestere mot vår bruk av dem, og rett til å få en kopi. For å benytte deg av noen av disse, send oss
          en e-post på {COMPANY.email}.
        </p>
        <p>
          Du kan også klage til Datatilsynet. Er du i Storbritannia, kan du i stedet klage til Information
          Commissioner&apos;s Office (ICO).
        </p>
      </>
    ),
  },
  {
    heading: 'Kontakt',
    body: (
      <p>
        Spørsmål om denne erklæringen? Send en e-post til {COMPANY.email}, eller se{' '}
        <Link href="/no/terms" className="underline hover:text-neutral-900">vilkårene våre</Link> og{' '}
        <Link href="/no/delivery" className="underline hover:text-neutral-900">levering og retur</Link>.
      </p>
    ),
  },
];

export default function NorwegianPrivacyPage() {
  return (
    <LegalPage
      title={PAGE_TITLE}
      lastUpdated={LAST_UPDATED}
      sections={sections}
      strings={{ home: no.shared.home, homeHref: '/no', lastUpdatedLabel: 'Sist oppdatert:' }}
    />
  );
}
