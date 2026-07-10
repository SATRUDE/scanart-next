import type { Metadata } from 'next';
import Link from 'next/link';
import { QualityPromise } from '@/components/QualityPromise';
import { FullWidthImage } from '@/components/FullWidthImage';
import { BASE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The story of Scandinavian Art: an online gallery working directly with Scandinavian artists to bring authentic Nordic prints into homes around the world.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <div className="lg:col-span-1">
              <h1 className="text-3xl text-neutral-900 mb-0">About Scandinavian Art</h1>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                Scandinavian Art exists to bring the distinct Scandinavian aesthetic into homes around the world, while giving the artists behind it the chance to reach a wider audience.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                The idea came from a conversation with a friend, an artist living in Oslo. We realised how little Scandinavian artwork reached the rest of the world, and set out to create a place where these talented artists could showcase their work to a broader audience.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                At its core, Scandinavian design celebrates natural materials, clean lines and the concept of lagom, having just the right amount. The prints we curate carry that spirit: serene, purposeful and timeless.
              </p>
              <Link href="/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                View all products
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-3xl text-neutral-900 mb-0">Working with artists</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                We work directly with local artists, leveraging their expertise to select the most authentic pieces, so the collection stays fresh, diverse and of the highest quality. Every print is produced on museum-quality paper using premium printing techniques, with professional framing available.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                Every purchase directly supports the artist behind it, helping them gain the recognition they deserve and continue creating. By choosing Scandinavian Art, you put a piece of Scandinavia in your home and support the people who make it.
              </p>
              <Link href="/journal" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                Read the journal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <QualityPromise />
      <FullWidthImage />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About Scandinavian Art',
            url: `${BASE_URL}/about`,
            mainEntity: {
              '@type': 'Organization',
              name: 'Scandinavian Art Gallery',
              url: BASE_URL,
              logo: `${BASE_URL}/images/scandinavian-art-gallery-og.jpg`,
              // the gallery's live profiles, same URLs the Footer links
              sameAs: [
                'https://www.instagram.com/helloscandinavianart/',
                'https://www.facebook.com/people/Scandinavian-Art/61563171855842/',
              ],
            },
          }),
        }}
      />
    </div>
  );
}
