import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Cart } from '@/components/Cart';
import { Footer } from '@/components/Footer';
import { RouteChangeTracker } from '@/components/RouteChangeTracker';
import { getAllProducts } from '@/lib/products';
import { BASE_URL } from '@/lib/site';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          defer
          src="https://datamachine.vercel.app/script.js"
          data-website-id="a2c30bff-57c9-4b47-a7a1-c77bb1718e41"
          data-domains="www.scandinavianart.co.uk"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header categories={categories} />
            <main>{children}</main>
            <Cart />
          </div>
          <Footer />
          <RouteChangeTracker />
        </Providers>
      </body>
    </html>
  );
}
