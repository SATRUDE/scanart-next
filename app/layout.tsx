import type { Metadata } from 'next';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Cart } from '@/components/Cart';
import { Footer } from '@/components/Footer';
import { RouteChangeTracker } from '@/components/RouteChangeTracker';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.scandinavianart.co.uk'),
  title: {
    default: 'Scandinavian Art Gallery - Curated Nordic Artwork & Prints',
    template: '%s | Scandinavian Art Gallery',
  },
  description: 'Scandinavian Art Gallery - Curated selection of exquisite Nordic artwork and prints from talented Scandinavian artists. Free UK delivery.',
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
    title: 'Scandinavian Art Gallery - Curated Nordic Artwork & Prints',
    description: 'Discover exquisite Scandinavian and Nordic artwork from talented artists. Shop curated wall art, prints, and original pieces.',
    url: 'https://www.scandinavianart.co.uk',
    siteName: 'Scandinavian Art Gallery',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: '/images/scandinavian-art-gallery-og.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scandinavian Art Gallery - Curated Nordic Artwork & Prints',
    description: 'Discover exquisite Scandinavian and Nordic artwork from talented artists.',
    images: ['/images/scandinavian-art-gallery-og.png'],
    site: '@scandinavianart',
  },
  alternates: {
    canonical: 'https://www.scandinavianart.co.uk',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <Script
          defer
          src="https://datamachine.vercel.app/script.js"
          data-website-id="a2c30bff-57c9-4b47-a7a1-c77bb1718e41"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
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
