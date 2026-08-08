import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getInspireScenes } from '@/lib/inspire';
import { getAllProducts } from '@/lib/products';
import { BASE_URL, socialCard } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const scenes = await getInspireScenes();
  const description =
    'Scandinavian art print inspiration: framed Nordic prints styled in real bedrooms, kitchens, dining rooms and home offices. Browse the scenes and click through to the prints they feature.';
  return {
    title: 'Scandinavian Art Print Inspiration | Styled Room Ideas',
    description,
    alternates: {
      canonical: '/inspire',
    },
    ...socialCard({
      title: 'Scandinavian Art Print Inspiration',
      description,
      path: '/inspire',
      image: scenes[0]?.image,
    }),
  };
}

export default async function InspirePage() {
  // Resolve each scene's slugs against the live catalogue; a scene whose
  // every print has been retired drops out rather than dead-linking.
  const [inspireScenes, all] = await Promise.all([getInspireScenes(), getAllProducts()]);
  const bySlug = new Map(all.map(p => [p.slug, p]));
  const scenes = inspireScenes
    .map(scene => ({
      ...scene,
      products: scene.slugs
        .map(s => bySlug.get(s))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    }))
    .filter(scene => scene.products.length > 0);

  // Gallery structured data: the wall as an ImageGallery of ImageObjects,
  // each pointing at the product it features — the Google Images signal the
  // own-domain-only image sitemap can't carry for Blob-hosted scenes.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Scandinavian Art Print Inspiration',
    url: `${BASE_URL}/inspire`,
    mainEntity: {
      '@type': 'ImageGallery',
      name: 'Scandinavian art prints styled in real rooms',
      image: scenes.map(scene => ({
        '@type': 'ImageObject',
        contentUrl: scene.image,
        description: scene.alt,
        width: scene.width,
        height: scene.height,
        // Plain URL references: declaring typed Product entities here made
        // Search Console demand offers/review/aggregateRating on each — the
        // product pages carry the full Product markup, the wall just points.
        about: scene.products.map(p => `${BASE_URL}/product/${p.slug}`),
      })),
    },
  };

  return (
    <div className="container mx-auto px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mb-16">
        <h1 className="text-3xl text-neutral-900">Inspire</h1>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">
          Our prints, styled in rooms like yours. Browse the wall for a feeling rather than a
          search term, and when a scene stops you, the print it features is one click away.
        </p>
      </header>

      <h2 className="sr-only">Styled scenes</h2>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:balance]">
        {scenes.map((scene, index) => (
          <div key={scene.image} className="mb-6 break-inside-avoid">
            <Link href={`/product/${scene.products[0].slug}`} className="group block">
              <div className="overflow-hidden rounded bg-neutral-50">
                {/* This page is a wall of room scenes with almost no text above
                    it, so the first scene is the LCP element at every width.
                    Preload that one and leave the other eleven lazy. */}
                <Image
                  src={scene.image}
                  alt={scene.alt}
                  width={scene.width}
                  height={scene.height}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  preload={index === 0}
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Featuring{' '}
              {scene.products.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && ' and '}
                  <Link
                    href={`/product/${p.slug}`}
                    className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.artist ? ` by ${p.artist}` : ''}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          Looking for a particular room instead?{' '}
          <Link href="/collection/living-room" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            Living room
          </Link>
          ,{' '}
          <Link href="/collection/bedroom" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            bedroom
          </Link>{' '}
          and{' '}
          <Link href="/collection/home-office" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            home office
          </Link>{' '}
          each have their own curated wall, or browse{' '}
          <Link href="/products" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            the full collection
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
