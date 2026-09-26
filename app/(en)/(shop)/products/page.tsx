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

const PAGE_TITLE = 'Nordic & Scandinavian Art Prints: A Curated Collection';
const PAGE_DESCRIPTION =
  'A curated collection of Scandinavian and Nordic art prints by independent Norwegian artists. Framed or unframed, with worldwide delivery.';
/** The page's H1, unchanged from before V2 (the Figma frame says "Prints"). */
const HEADING = 'Nordic & Scandinavian Art Prints';

export const metadata: Metadata = {
  // 54 characters of its own, so the layout's brand suffix pushed the rendered
  // title to 81 and Google cut it. metaTitle drops the suffix here.
  title: metaTitle(PAGE_TITLE),
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: '/products',
    languages: hreflangPair('/products'),
  },
  ...socialCard({ title: PAGE_TITLE, description: PAGE_DESCRIPTION, path: '/products' }),
};

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** "Norway and Sweden", from where the published artists live (data/artists.ts). */
function joinCountries(countries: string[], and: string) {
  return countries.length < 2 ? countries.join('') : `${countries.slice(0, -1).join(', ')} ${and} ${countries[countries.length - 1]}`;
}

// Statically prerendered. This page used to await the searchParams prop (a
// Dynamic API) so that the grid's useSearchParams resolved on the server and
// the served HTML carried the catalogue rather than a Suspense fallback. The
// cost was that /products alone was rendered per request and served
// `Cache-Control: private, no-store`, so it never hit the CDN. The query is
// now read by a leaf component behind its own Suspense boundary inside
// PrintsListing, which is what useSearchParams wants: only that leaf is
// client-rendered, and the grid above it prerenders into the static HTML.
export default async function ProductsPage() {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();
  const artists = await getPublishedArtists();
  const countries = [...new Set(artists.map(a => a.location.split(',').pop()!.trim()))];

  // Structured data for the core "art prints" landing: CollectionPage plus an
  // ItemList enumerating the full catalogue, matching the sibling listing pages
  // (/collection, /artists, /journal). Rendered here in the server component so
  // it lands in the served HTML even though the grid itself is a client component.
  const collectionJsonLd = collectionPageJsonLd({
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: '/products',
    locale: 'en',
    products,
  });

  return (
    <div className="page-x pb-section">
      {/* V2 gives /products its own copy rather than the /nordic-art text the
          Figma frame reuses, so the two pages don't compete for the same query
          (docs/v2-seo.md, item 4). It links to /nordic-art instead. */}
      <PageHeader
        title={HEADING}
        lead={`Prints by ${NUMBERS[artists.length] ?? artists.length} independent artists working in ${joinCountries(countries, 'and')}. Each one is made to order, framed or unframed, and delivered worldwide.`}
        meta={[`${products.length} prints`, <FromPrice key="from" prices={lowestPrices(products)} label="from" />]}
      />

      <div className="mt-6 tab:mt-band desk:mt-[128px]">
        <PrintsListing products={products} categories={categories} />
      </div>

      <ContentSection
        id="buying-a-print"
        title="How buying a print works"
        className="mt-section"
        intro={
          <>
            <p>
              Every print is made to order when you buy it, on 200gsm uncoated paper, rather than
              taken from a warehouse shelf. Most are 50 x 70 cm and the square illustrations are 50 x 50 cm.
              Each product page shows the size and the price for it before anything goes in your basket.
            </p>
            <p>
              Choose the print unframed, or framed in wood, black or white, sized to fit. We deliver
              worldwide, and the delivery cost is shown at checkout.
            </p>
          </>
        }
      >
        <ContentBody>
          <p>
            If you want the background first,{' '}
            <Link href="/nordic-art" className="transition-colors hover:text-ink">Nordic art, from folk tradition to now</Link>{' '}
            is the story of the traditions these artists draw on. If you already know the room,{' '}
            <Link href="/scandinavian-wall-art" className="transition-colors hover:text-ink">Scandinavian wall art</Link>{' '}
            takes the whole gallery room by room.
          </p>
        </ContentBody>
      </ContentSection>

      <LandingCrossLinks current={{ type: 'products', slug: 'products' }} artists={artists} className="mt-section" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
    </div>
  );
}
