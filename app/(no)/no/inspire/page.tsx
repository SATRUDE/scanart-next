import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getInspireScenes } from '@/lib/inspire';
import { getAllProducts } from '@/lib/products';
import { BASE_URL, socialCard } from '@/lib/site';
import { metaTitle } from '@/lib/meta-title';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian Inspire wall: app/inspire/page.tsx mirrored exactly (same
// components, same classes, same JSON-LD shape), with the copy swapped for
// lib/i18n/no.ts and every link kept inside the /no tree.
const t = no.inspire;

export async function generateMetadata(): Promise<Metadata> {
  const scenes = await getInspireScenes();
  return {
    title: metaTitle(t.meta.title),
    description: t.meta.description,
    alternates: {
      canonical: '/no/inspire',
      languages: hreflangPair('/inspire'),
    },
    ...socialCard({
      title: t.meta.socialTitle,
      description: t.meta.description,
      path: '/no/inspire',
      image: scenes[0]?.image,
      ogLocale: 'nb_NO',
    }),
  };
}

export default async function NorwegianInspirePage() {
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

  // Same gallery structured data as the English wall, pointed at the /no
  // product URLs so the Norwegian page references its own tree.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.jsonLdName,
    url: `${BASE_URL}/no/inspire`,
    inLanguage: 'nb-NO',
    mainEntity: {
      '@type': 'ImageGallery',
      name: t.galleryName,
      image: scenes.map(scene => ({
        '@type': 'ImageObject',
        contentUrl: scene.image,
        description: scene.alt,
        width: scene.width,
        height: scene.height,
        about: scene.products.map(p => `${BASE_URL}/no/product/${p.slug}`),
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
        <h1 className="text-3xl text-neutral-900">{t.heading}</h1>
        <p className="text-muted-foreground leading-relaxed mt-4 max-w-3xl">{t.intro}</p>
      </header>

      <h2 className="sr-only">{t.scenesSrHeading}</h2>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:balance]">
        {scenes.map((scene, index) => (
          <div key={scene.image} className="mb-6 break-inside-avoid">
            <Link href={`/no/product/${scene.products[0].slug}`} className="group block">
              <div className="overflow-hidden rounded bg-neutral-50">
                {/* First scene is the LCP element at every width, as on the
                    English wall: preload that one, leave the rest lazy. */}
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
              {t.featuring}{' '}
              {scene.products.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 && ` ${t.and} `}
                  <Link
                    href={`/no/product/${p.slug}`}
                    className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors"
                  >
                    {p.name}
                  </Link>
                  {p.artist ? ` ${t.by} ${p.artist}` : ''}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          {t.roomsIntro}{' '}
          <Link href="/no/collection/living-room" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            {t.livingRoom}
          </Link>
          ,{' '}
          <Link href="/no/collection/bedroom" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            {t.bedroom}
          </Link>{' '}
          {t.and}{' '}
          <Link href="/no/collection/home-office" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            {t.homeOffice}
          </Link>{' '}
          {t.roomsOutro}{' '}
          <Link href="/no/products" className="font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
            {t.fullCollection}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
