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

const PAGE_TITLE = 'Nordic & Scandinavian Art Prints: A Curated Collection';
const PAGE_DESCRIPTION =
  'A curated collection of Scandinavian and Nordic art prints by independent Nordic artists. Framed or unframed, with worldwide delivery.';

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

// Statically prerendered. This page used to await the searchParams prop (a
// Dynamic API) so that the grid's useSearchParams resolved on the server and
// the served HTML carried the catalogue rather than a Suspense fallback. The
// cost was that /products alone was rendered per request and served
// `Cache-Control: private, no-store`, so it never hit the CDN. The query is
// now read by a leaf component behind its own Suspense boundary inside
// ShopFrame, which is what useSearchParams wants: only that leaf is
// client-rendered, and the grid prerenders into the static HTML.
//
// The page header (the H1 "Nordic & Scandinavian Art Prints", the lead and the
// meta line) and the Filter bar are rendered by the shop layout,
// app/(en)/(shop)/layout.tsx, so they stay put when a visitor moves between
// this page and a category or collection (components/v2/shop/shop-routes.tsx).
export default async function ProductsPage() {
  const products = await getAllProducts();
  const artists = await getPublishedArtists();

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
    <>
      <ShopGrid products={products} />

      {/* V2 gives /products its own copy rather than the /nordic-art text the
          Figma frame reuses, so the two pages don't compete for the same query
          (docs/v2-seo.md, item 4). It links to /nordic-art instead. */}
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
    </>
  );
}
