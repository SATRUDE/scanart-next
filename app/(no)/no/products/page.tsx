import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { PageHeader, ContentSection, ContentBody } from '@/components/v2/ui';
import { PrintsListing } from '@/components/v2/prints/PrintsListing';
import { FromPrice } from '@/components/v2/prints/FromPrice';
import { lowestPrices } from '@/components/v2/prints/lowest-prices';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { collectionPageJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian catalogue: app/(en)/products/page.tsx mirrored, with the
// listing given locale="no" so every option, card and empty-state link stays in
// the /no tree, and its labels swapped for lib/i18n/no.ts.
const t = no.products;

export const metadata: Metadata = {
  title: metaTitle(t.meta.title),
  description: t.meta.description,
  alternates: {
    canonical: '/no/products',
    languages: hreflangPair('/products'),
  },
  ...socialCard({
    title: t.meta.title,
    description: t.meta.description,
    path: '/no/products',
    ogLocale: 'nb_NO',
  }),
};

function joinCountries(countries: string[], and: string) {
  return countries.length < 2 ? countries.join('') : `${countries.slice(0, -1).join(', ')} ${and} ${countries[countries.length - 1]}`;
}

// Statically prerendered, exactly as the English page is: the query is read by
// a leaf behind PrintsListing's own Suspense boundary, so the catalogue lands in
// the served HTML rather than a fallback.
export default async function NorwegianProductsPage() {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();
  const artists = await getPublishedArtists();
  const countries = [...new Set(artists.map(a => a.location.split(',').pop()!.trim()))].map(c => t.page.countries[c] ?? c);
  const lead = t.page.lead
    .replace('{artists}', t.page.numbers[artists.length] ?? String(artists.length))
    .replace('{countries}', joinCountries(countries, t.page.and));

  const collectionJsonLd = collectionPageJsonLd({
    name: t.meta.title,
    description: t.meta.description,
    path: '/no/products',
    locale: 'no',
    inLanguage: 'nb-NO',
    products,
  });

  return (
    <div className="page-x pb-section">
      <PageHeader
        title={t.grid.heading}
        locale="no"
        lead={lead}
        meta={[`${products.length} ${t.grid.printsSuffix}`, <FromPrice key="from" prices={lowestPrices(products)} label={no.shared.fromPrice} />]}
      />

      <div className="mt-6 tab:mt-block desk:mt-[128px]">
        <PrintsListing
          products={products}
          categories={categories}
          locale="no"
          strings={{
            ...t.grid,
            categoryLabels: no.shared.categoryLabels,
            collectionChips: no.shared.collectionChips,
          }}
        />
      </div>

      <ContentSection
        id="buying-a-print"
        title={t.page.contentHeading}
        className="mt-section"
        intro={
          <>
            <p>{t.page.contentP1}</p>
            <p>{t.page.contentP2}</p>
          </>
        }
      >
        <ContentBody>
          {/* /nordic-art is English only, so the Norwegian page points at the
              wall-art landing, which has a twin. */}
          <p>
            {t.page.contentP3Before}
            <Link href="/no/scandinavian-wall-art" className="transition-colors hover:text-ink">{t.page.contentP3Link}</Link>
            {t.page.contentP3After}
          </p>
        </ContentBody>
      </ContentSection>

      <LandingCrossLinks current={{ type: 'products', slug: 'products' }} strings={no.crossLinks} locale="no" artists={artists} className="mt-section" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </div>
  );
}
