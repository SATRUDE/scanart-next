import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Cart } from '@/components/Cart';
import { Footer } from '@/components/Footer';
import { ScrollDepth } from '@/components/ScrollDepth';
import { getAllProducts } from '@/lib/products';
import { BASE_URL, SITE_NAME } from '@/lib/site';
import Script from 'next/script';
import './globals.css';

/**
 * The document every page shares, with the language as a prop.
 *
 * Next.js renders <html> only in a root layout, and a nested layout cannot.
 * That is why /no pages served `lang="en"` until 24 August 2026 while an inline
 * script and a client effect corrected it after the fact: right for anyone
 * running JS, wrong in the HTML itself, which is a WCAG 3.1.1 (Level A)
 * failure for a screen reader reading the served markup.
 *
 * The fix is two root layouts, one per route group, sharing this component. The
 * alternative was reading the pathname from `headers()` in a single root
 * layout, which would opt all 37 pages out of static rendering: too high a
 * price on a site whose LCP is already a known problem.
 *
 * To be clear about what this is NOT: `lang` is not a search signal. Google's
 * multi-regional documentation says "we don't use any code-level language
 * information such as lang attributes, or the URL", and determines language
 * from visible content. This is an accessibility fix and nothing else.
 */
export async function SiteDocument({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: 'en' | 'no';
}) {
  const products = await getAllProducts();
  const categories = [...new Set(products.map(p => p.category))].sort();

  return (
    <html lang={lang}>
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
