import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Cart } from '@/components/Cart';
import { Footer } from '@/components/Footer';
import { LocaleSuggestionBanner } from '@/components/LocaleSuggestionBanner';
import { ScrollDepth } from '@/components/ScrollDepth';
import { getAllProducts } from '@/lib/products';
import { BASE_URL, SITE_NAME } from '@/lib/site';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Scandinavian Art Gallery | Framed Nordic Art Prints',
    template: '%s | Scandinavian Art Gallery',
  },
  description: 'Curated Scandinavian and Nordic art prints from independent artists. Shop framed or unframed wall art, delivered worldwide. Discover the collection.',
  keywords: ['Scandinavian art', 'Nordic art', 'Scandinavian wall art', 'Nordic prints', 'Scandinavian artists', 'art gallery', 'wall art', 'prints', 'artwork', 'Nordic design'],
  authors: [{ name: 'Scandinavian Art Gallery' }],
  robots: 'index, follow',
  // NOTE: the RSS autodiscovery link is NOT declared here. Metadata objects are
  // merged *shallowly* down the segment tree, so a page that sets `alternates`
  // at all (every page in this app sets `alternates.canonical`) replaces the
  // root's whole `alternates` object and drops a `types` entry declared here.
  // It lived here until 2026-08-20 and reached no page's <head> as a result, so
  // it is rendered as a raw <link> in the <head> below instead: that applies to
  // every route, including any added later, with no per-page opt-in to forget.
  verification: {
    google: 'Q044oiN2tnwr8F7eUthQjHaf0jXLsFmHuS1ZnN2aEV0',
  },
  other: {
    'p:domain_verify': 'f545c7d3764c8418167cc16b7612b605',
  },
  openGraph: {
    title: 'Scandinavian Art Gallery | Framed Nordic Art Prints',
    description: 'Curated Scandinavian and Nordic art prints from independent artists. Shop framed or unframed wall art, delivered worldwide.',
    url: BASE_URL,
    siteName: 'Scandinavian Art Gallery',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: '/images/scandinavian-art-gallery-og.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scandinavian Art Gallery | Framed Nordic Art Prints',
    description: 'Curated Scandinavian and Nordic art prints from independent artists. Framed or unframed, delivered worldwide.',
    images: ['/images/scandinavian-art-gallery-og.jpg'],
    site: '@scandinavianart',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <html lang="en">
      <head>
        {/* Journal RSS autodiscovery, so readers and aggregators can find
            /feed.xml from any page. Absolute href: some feed readers do not
            resolve a relative one. See the note on `metadata` above for why
            this is not declared through alternates.types. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} Journal`}
          href={`${BASE_URL}/feed.xml`}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          defer
          src="https://datamachine.vercel.app/script.js"
          data-website-id="a2c30bff-57c9-4b47-a7a1-c77bb1718e41"
          data-domains="www.scandinavianart.co.uk"
          data-performance="true"
          strategy="afterInteractive"
        />
        {/* Umami heatmap recorder (click coordinates + scroll depth, no DOM
            capture). Completely inert until the Heatmaps toggle is on in the
            Umami dashboard: it self-configures from the /recorder endpoint,
            currently {"enabled":false}. Waits on the tracker's session, so it
            sits alongside script.js above. */}
        <Script
          defer
          src="https://datamachine.vercel.app/recorder.js"
          data-website-id="a2c30bff-57c9-4b47-a7a1-c77bb1718e41"
          strategy="afterInteractive"
        />
        {/* Pinterest Tag (conversion + retargeting). Enhanced-match email is
            intentionally omitted: we have no visitor email at page load. */}
        <Script id="pinterest-tag" strategy="afterInteractive">
          {`!function(e){if(!window.pintrk){window.pintrk = function () {
window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
  n=window.pintrk;n.queue=[],n.version="3.0";var
  t=document.createElement("script");t.async=!0,t.src=e;var
  r=document.getElementsByTagName("script")[0];
  r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '2613500774753');
pintrk('page');`}
        </Script>
      </head>
      <body>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- Pinterest 1x1 tracking beacon for no-JS visitors; cannot be next/image */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src="https://ct.pinterest.com/v3/?event=init&tid=2613500774753&noscript=1"
          />
        </noscript>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* First-visit suggestion for Norwegian-speaking browsers; renders
                nothing on /no pages, after dismissal, or for everyone else. */}
            <LocaleSuggestionBanner />
            <Header categories={categories} />
            <main>{children}</main>
            <Cart />
          </div>
          {/* The copyright year is resolved here, in the server layout, so the
              footer never carries a hand-written year. It is fixed at build,
              which is what every page of a statically rendered site can offer;
              the site redeploys several times a week, so the only window where
              it can lag is a new year with no deploy in it. */}
          <Footer year={new Date().getFullYear()} />
          <ScrollDepth />
        </Providers>
      </body>
    </html>
  );
}
