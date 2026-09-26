import type { Metadata } from 'next';
import { COMPANY } from '@/config/company';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import { noV2 } from '@/lib/i18n/no-v2-pages';
import { shopScenes } from '@/lib/shop-scenes';
import { getProductBySlug } from '@/lib/products';
import { sceneImageAlt } from '@/lib/product-image-alt';
import { DeliveryBody } from '@/components/v2/delivery/DeliveryBody';

// The Norwegian Delivery & Returns page: app/(en)/delivery/page.tsx mirrored
// exactly (same DeliveryBody), with the copy swapped for lib/i18n/no.ts and
// every link kept inside /no.
const t = no.delivery;
const v = noV2.delivery;

export const metadata: Metadata = {
  title: t.meta.title,
  description: t.meta.description,
  alternates: {
    canonical: '/no/delivery',
    languages: hreflangPair('/delivery'),
  },
  ...socialCard({ title: t.meta.title, description: t.meta.description, path: '/no/delivery', ogLocale: 'nb_NO' }),
};

// Fill an {email}/{country} placeholder string (the values are plain text).
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

/** A Help answer, verbatim, so the two pages can never disagree. */
const answer = (q: string) => no.help.groups.flatMap(g => g.items).find(i => i.q === q)?.a ?? '';

const scene = shopScenes['swallow-dive'];

export default async function NorwegianDeliveryPage() {
  // The picture's alt in bokmål, from the catalogue, as the product page says it.
  const print = await getProductBySlug('swallow-dive');
  const alt = print
    ? sceneImageAlt({ name: print.name, artist: print.artist, brand: print.brand, category: print.category }, 'no')
    : scene.alt;
  const s = t.sections;

  return (
    <DeliveryBody
      copy={{
        locale: 'no',
        title: t.pageTitle,
        breadcrumb: [{ label: t.breadcrumbHome, href: '/no' }, { label: t.pageTitle }],
        lead: v.lead,
        lastUpdatedLabel: t.lastUpdatedLabel.replace(/:\s*$/, ''),
        lastUpdated: t.lastUpdated,
        made: { heading: s.made.heading, body: <p>{s.made.body}</p> },
        production: { heading: s.production.heading, list: v.productionList },
        figure: { src: scene.image, alt, width: scene.width, height: scene.height, caption: `Swallow Dive ${v.by} Helene Brox` },
        times: { heading: s.times.heading, body: <p>{s.times.body}</p> },
        worldwide: { heading: s.worldwide.heading, body: <p>{fill(s.worldwide.body, { country: COMPANY.country })}</p> },
        returns: {
          heading: v.returnsHeading,
          items: [
            { title: s.cancellations.heading, body: fill(s.cancellations.body, { email: COMPANY.email }) },
            { title: s.faulty.heading, body: fill(s.faulty.body, { email: COMPANY.email }) },
            { title: s.refunds.heading, body: s.refunds.body },
          ],
          emailLabel: v.emailUs,
          termsLabel: v.termsRow,
          termsHref: '/no/terms',
        },
        questions: {
          heading: no.shared.commonQuestions,
          items: [
            { q: v.questions.time, a: answer('Hvor lang tid tar bestillingen min?') },
            { q: v.questions.duties, a: answer('Må jeg betale toll eller importavgifter?') },
            { q: v.questions.cancel, a: answer('Kan jeg endre eller avbestille bestillingen min?') },
            { q: v.questions.damaged, a: answer('Bestillingen min kom frem skadet, med feil eller var feil vare.') },
          ],
        },
        contact: {
          heading: s.contact.heading,
          intro: v.contactIntro,
          rows: [
            { href: `mailto:${COMPANY.email}`, label: COMPANY.email },
            { href: '/no/terms', label: v.termsRow },
            { href: '/no/privacy', label: v.privacyRow },
          ],
          beforeHeading: v.beforeYouWrite,
          beforeList: v.beforeList,
        },
        email: COMPANY.email,
      }}
    />
  );
}
