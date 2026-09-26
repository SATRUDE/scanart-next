import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { ContentSection, ContentBody } from '@/components/v2/ui';
import { ShopGrid } from '@/components/v2/shop/ShopGrid';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { collectionPageJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian catalogue: app/(en)/(shop)/products/page.tsx mirrored. The
// header and Filter bar come from app/(no)/no/(shop)/layout.tsx, which gives
// them locale="no" so every option, card and empty-state link stays in the /no
// tree, with labels from lib/i18n/no.ts.
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

// Statically prerendered, exactly as the English page is: the query is read by
// a leaf behind ShopFrame's own Suspense boundary, so the catalogue lands in
// the served HTML rather than a fallback.
export default async function NorwegianProductsPage() {
  const products = await getAllProducts();
  const artists = await getPublishedArtists();

  const collectionJsonLd = collectionPageJsonLd({
    name: t.meta.title,
    description: t.meta.description,
    path: '/no/products',
    locale: 'no',
    inLanguage: 'nb-NO',
    products,
  });

  return (
    <>
      <ShopGrid products={products} />

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
    </>
  );
}
