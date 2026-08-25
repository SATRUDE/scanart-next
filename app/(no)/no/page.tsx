import type { Metadata } from 'next';
import { TrackedLink } from '@/components/TrackedLink';
import Image from 'next/image';
import { getFeaturedProducts, getProductsByArtist } from '@/lib/products';
import { artists } from '@/data/artists';
import { ArtistsList, ArtistWithCount } from '@/components/ArtistsList';
import { HeroSection } from '@/components/HeroSection';
import { QualityPromise } from '@/components/QualityPromise';
import { Testimonials } from '@/components/Testimonials';
import { FullWidthImage } from '@/components/FullWidthImage';
import { getCategoryLandingByCategory } from '@/lib/categories';
import { BASE_URL, socialCard } from '@/lib/site';
import { getAllArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian homepage: app/page.tsx mirrored exactly (same components,
// same classes, same data), with the copy swapped for lib/i18n/no.ts. The
// journal teaser stays: articles are English in phase one, and their cards
// link to the English article pages.
export const metadata: Metadata = {
  title: { absolute: no.home.meta.title },
  description: no.home.meta.description,
  alternates: {
    canonical: '/no',
    languages: hreflangPair('/'),
  },
  ...socialCard({
    title: no.home.meta.title,
    description: no.home.meta.description,
    path: '/no',
    ogLocale: 'nb_NO',
  }),
};

export default async function NorwegianHomePage() {
  const featuredProducts = await getFeaturedProducts();
  // Hero-only override: Vinkveld shows its styled Inspire scene (Mark's
  // pick, 2026-08-07), matching the English homepage.
  const heroProducts = featuredProducts.map(p =>
    p.slug === 'vinkveld'
      ? { ...p, image: '/images/homepage/vinkveld-scene.jpg', secondaryImage: '/images/homepage/vinkveld-scene.jpg' }
      : p
  );
  // Featured articles first, newest fill the remaining slots; same curation
  // as the English homepage (see app/page.tsx).
  const allArticles = await getAllArticles();
  const latestArticles = [
    ...allArticles.filter(a => a.featured),
    ...allArticles.filter(a => !a.featured),
  ].slice(0, 3);

  // Artists with published work, most-published first, for the homepage
  // teaser; bios and locations swapped for the Norwegian copy.
  const artistsWithCounts: ArtistWithCount[] = [];
  for (const artist of artists) {
    const products = await getProductsByArtist(artist.id);
    if (products.length > 0) {
      const copy = no.artists[artist.slug];
      artistsWithCounts.push({
        ...artist,
        ...(copy ? { bio: copy.bio, location: copy.location } : {}),
        printCount: products.length,
      });
    }
  }
  artistsWithCounts.sort((a, b) => b.printCount - a.printCount || a.name.localeCompare(b.name));
  const featuredArtists = artistsWithCounts.slice(0, 3);

  return (
    <div className="min-h-screen">
      <HeroSection products={heroProducts} strings={no.home.hero} categoryLabels={no.shared.categoryLabels} locale="no" />

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <div className="lg:col-span-1">
              <h2 className="text-3xl text-neutral-900 mb-0">{no.home.exploreHeading}</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                {no.home.exploreIntro}
              </p>
              <TrackedLink event="homepage-section-click" eventData={{ section: 'explore-categories', target: '/no/products', locale: 'no' }} href="/no/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                {no.home.allCategories}
              </TrackedLink>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { name: 'Botanical', image: '/images/homepage/botanical.avif' },
              { name: 'Illustrations', image: '/images/homepage/illustration.avif' },
              { name: 'Abstract', image: '/images/homepage/abstract.avif' },
            ].map(cat => {
              const landing = getCategoryLandingByCategory(cat.name);
              const tile = no.home.categoryTiles[cat.name];
              return (
              <TrackedLink key={cat.name} event="homepage-section-click" eventData={{ section: 'category-tile', target: cat.name, locale: 'no' }} href={landing ? `/no/category/${landing.slug}` : `/no/products?category=${cat.name}`} className="group cursor-pointer">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 rounded mb-4">
                  <Image src={cat.image} alt={`Kategorien ${tile?.name ?? cat.name}`} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-all duration-300 group-hover:scale-[1.02]" />
                </div>
                <h3 className="text-lg font-medium mb-2">{tile?.name ?? cat.name}</h3>
                <p className="text-muted-foreground text-sm">{tile?.desc}</p>
              </TrackedLink>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <TrackedLink event="homepage-section-click" eventData={{ section: 'view-all-products', target: '/no/products', locale: 'no' }} href="/no/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
              {no.home.viewAllProducts}
            </TrackedLink>
          </div>
        </div>
      </section>

      <QualityPromise strings={no.qualityPromise} />
      <Testimonials strings={no.testimonials} />
      <FullWidthImage locale="no" />

      {/* Meet the artists: homepage door-in to the /no/artists hub and artist pages */}
      {featuredArtists.length > 0 && (
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-6 mb-8">
              <h2 className="text-3xl font-normal text-neutral-900">{no.home.meetTheArtists}</h2>
              <TrackedLink
                event="homepage-section-click"
                eventData={{ section: 'meet-the-artists', target: '/no/artists', locale: 'no' }}
                href="/no/artists"
                className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors whitespace-nowrap"
              >
                {no.home.viewAllArtists} →
              </TrackedLink>
            </div>
            <ArtistsList artists={featuredArtists} locale="no" printLabels={{ one: no.shared.printOne, other: no.shared.printOther }} />
          </div>
        </section>
      )}

      {/* From the journal: articles stay English in phase one, so the cards
          link to the English article pages */}
      {latestArticles.length > 0 && (
        <section className="container mx-auto px-8 py-16">
          <div className="flex items-center justify-between gap-6 mb-8">
            <h2 className="text-3xl font-normal text-neutral-900">{no.home.fromTheJournal}</h2>
            <TrackedLink
              event="homepage-section-click"
              eventData={{ section: 'from-the-journal', target: '/no/journal', locale: 'no' }}
              href="/no/journal"
              className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors whitespace-nowrap"
            >
              {no.home.readTheJournal} →
            </TrackedLink>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                imageAspectClass={i === 2 ? 'aspect-[16/9]' : 'aspect-[4/3]'}
              />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Scandinavian Art Gallery',
            url: `${BASE_URL}/no`,
            inLanguage: 'no',
            description: no.home.jsonLdDescription,
            publisher: {
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
