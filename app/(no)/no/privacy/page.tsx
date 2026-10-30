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
const LAST_UPDATED = '29. oktober 2026';

const sections: LegalSection[] = [
  {
    heading: 'Hvem vi er',
    body: (
      <>
        <p>
          Scandinavian Art er et nettgalleri som selger kunsttrykk, drevet fra {COMPANY.countryNo}
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
        <ul>
          <li><strong>Ordredetaljer</strong>: navn, e-postadresse, leveringsadresse og varene du bestiller.</li>
          <li><strong>Betaling</strong>: betalinger behandles av Stripe. Kortopplysningene dine går direkte til Stripe; vi ser eller lagrer aldri hele kortnummeret ditt.</li>
          <li><strong>Bruk av nettstedet</strong>: hvilke sider som besøkes og hvordan nettstedet brukes, målt uten informasjonskapsler og uten å bygge en profil av deg (se Statistikk nedenfor).</li>
          <li><strong>Øktopptak</strong>: for noen besøk, et opptak av hvordan sidene ble brukt, der alt som skrives inn i et skjema er skjult (se Øktopptak nedenfor).</li>
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
        <ul>
          <li>For å behandle, produsere og levere bestillingen din og gi kundeservice: for å oppfylle avtalen med deg.</li>
          <li>For å føre regnskap og skatteopplysninger: for å oppfylle våre rettslige forpliktelser.</li>
          <li>For å forstå hvordan nettstedet brukes, forbedre butikken og holde nettstedet i gang, blant annet med statistikk og øktopptak: våre berettigede interesser.</li>
        </ul>
        <p>Vi bruker ikke opplysningene dine til markedsføring uten samtykke, og vi selger dem aldri.</p>
      </>
    ),
  },
  {
    heading: 'Statistikk',
    body: (
      <>
        <p>
          Vi bruker <strong>PostHog</strong>, på deres EU-sky, til å telle besøk og se hvilke sider og lenker som brukes.
          Det setter ingen informasjonskapsler og lagrer ingenting i nettleseren din. I stedet gjør PostHogs servere
          opplysninger om enheten din om til en kode blandet med en verdi som endres hver dag, slik at et besøk kan
          telles uten at du blir gjenkjent fra én dag til den neste. PostHog lager ingen profil av deg.
        </p>
        <p>
          Fram til rundt 9. november 2026 bruker vi også <strong>Umami</strong>, det forrige statistikkverktøyet vårt,
          ved siden av. Det fungerer også uten informasjonskapsler og teller besøk samlet.
        </p>
      </>
    ),
  },
  {
    heading: 'Øktopptak',
    body: (
      <>
        <p>
          For omtrent tre av ti besøk tar vi opp hvordan sidene brukes: sidene du ser på, hvordan du blar, hvor du
          beveger musepekeren og klikker, og hva som vises på skjermen. Vi ser på disse opptakene for å finne det som er
          forvirrende eller ikke virker, slik at vi kan forbedre butikken.
        </p>
        <ul>
          <li>Alt du skriver inn i et skjema, skjules i nettleseren din før opptaket sendes.</li>
          <li>Kortopplysninger blir aldri tatt opp: du skriver dem inn i Stripes sikre betalingsfelt, som opptaksverktøyet ikke kan se.</li>
          <li>Opptakene er ikke knyttet til navnet eller e-postadressen din, og et opptak stopper etter 5 minutter.</li>
          <li>Opptaksverktøyet setter ingen informasjonskapsler og lagrer ingenting i nettleseren din.</li>
          <li>
            Hvis nettleseren din sender Global Privacy Control eller Do Not Track, tar vi ikke opp besøket ditt i det hele
            tatt. De fleste nettlesere lar deg slå på en av disse i personverninnstillingene.
          </li>
        </ul>
        <p>
          Fram til rundt 9. november 2026 lages opptakene med Umami og lagres i databasen dets, som Neon drifter i USA.
          Etter det lages de av vårt eget opptaksverktøy og lagres i Cloudflare R2, i EU, og da skjuler vi også all
          tekst i skjemaer og på kasse- og ordresidene.
        </p>
        <p>
          Vi analyserer opptakene selv, omtrent hver fjortende dag, og sletter dem deretter. Vi beholder bare skriftlige
          funn, som ikke inneholder personopplysninger. Inntil 5 opptak kan beholdes i opptil 30 dager slik at vi kan se
          dem på nytt. Opptak vi ikke har analysert, slettes automatisk etter 90 dager.
        </p>
        <p>
          Det rettslige grunnlaget er vår berettigede interesse i å forstå hvordan butikken brukes og forbedre den. Du
          kan når som helst protestere ved å sende en e-post til {COMPANY.email}. Fordi opptakene ikke er knyttet til
          navnet ditt, kan det hende vi ikke finner et bestemt besøk, så å slå på Global Privacy Control eller Do Not
          Track er den sikreste måten å unngå opptak på.
        </p>
      </>
    ),
  },
  {
    heading: 'Informasjonskapsler',
    body: (
      <p>
        Dette nettstedet bruker ikke sporingskapsler. Statistikken og øktopptakene våre setter ingen informasjonskapsler
        og lagrer ingenting i nettleseren din, så vi ber deg ikke godta et cookie-banner. Skulle vi noen gang innføre
        sporingskapsler, oppdaterer vi denne erklæringen først.
      </p>
    ),
  },
  {
    heading: 'Hvem vi deler dem med',
    body: (
      <>
        <p>Vi deler opplysningene dine kun med leverandørene vi trenger for å oppfylle bestillingen din, og der loven krever det:</p>
        <ul>
          <li><strong>Stripe</strong>: for å ta imot betaling.</li>
          <li><strong>Gelato</strong> og deres leveringspartnere: for å trykke og sende bestillingen din.</li>
          <li><strong>Slack</strong>: ordredetaljene dine sendes til teamet vårt som et ordrevarsel.</li>
          <li><strong>PostHog</strong> (EU-sky): for å telle besøk og måle hvordan nettstedet brukes.</li>
          <li><strong>Umami</strong>, driftet for oss av Vercel og Neon i USA: det forrige statistikkverktøyet vårt og øktopptak, fram til rundt 9. november 2026.</li>
          <li><strong>Cloudflare</strong>: for å lagre øktopptak i R2-lagringen deres, i EU.</li>
        </ul>
        <p>
          Noen av disse leverandørene opererer utenfor {COMPANY.countryNo} og EØS. Der opplysningene dine overføres til
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
        Nettstatistikken vår er uten informasjonskapsler og aggregert, og lagres i tråd med innstillingene våre.
        Øktopptak som lagres i Cloudflare R2, slettes når vi har analysert dem, vanligvis innen
        omtrent to uker, bortsett fra inntil 5 som vi kan beholde i opptil 30 dager. Opptak som ikke analyseres, slettes
        automatisk etter 90 dager. Opptak laget med Umami blir liggende i databasen
        dets til vi legger den ned, noe vi planlegger å gjøre i november 2026.
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
        <Link href="/no/terms">vilkårene våre</Link> og{' '}
        <Link href="/no/delivery">levering og retur</Link>.
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
