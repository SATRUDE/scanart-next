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
import { BASE_URL } from '@/lib/site';
import { getAllArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  // Hero-only override: Vinkveld shows its styled Inspire scene in the hero
  // rotation (Mark's pick, 2026-08-07); the product page keeps the clean print.
  const heroProducts = featuredProducts.map(p =>
    p.slug === 'vinkveld' ? { ...p, image: '/images/homepage/vinkveld-scene.jpg' } : p
  );
  // Featured articles first (the Featured checkbox in Notion curates this
  // teaser), newest fill the remaining slots. Keeps a stable homepage link to
  // the pages we want search to treat as canonical for their topic, e.g. the
  // books pillar, which the homepage was cannibalising in search results.
  const allArticles = await getAllArticles();
  const latestArticles = [
    ...allArticles.filter(a => a.featured),
    ...allArticles.filter(a => !a.featured),
  ].slice(0, 3);

  // Artists with published work, most-published first, for the homepage teaser
  const artistsWithCounts: ArtistWithCount[] = [];
  for (const artist of artists) {
    const products = await getProductsByArtist(artist.id);
    if (products.length > 0) artistsWithCounts.push({ ...artist, printCount: products.length });
  }
  artistsWithCounts.sort((a, b) => b.printCount - a.printCount || a.name.localeCompare(b.name));
  const featuredArtists = artistsWithCounts.slice(0, 3);

  return (
    <div className="min-h-screen">
      <HeroSection products={heroProducts} />

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <div className="lg:col-span-1">
              <h2 className="text-3xl text-neutral-900 mb-0">Explore categories</h2>
            </div>
            <div className="lg:col-span-2">
              <p className="text-lg text-neutral-600 leading-relaxed mb-4">
                Carefully curated art pieces from talented Scandinavian artists, bringing authentic Nordic minimalism and truly timeless design into your home.
              </p>
              <TrackedLink event="homepage-section-click" eventData={{ section: 'explore-categories', target: '/products' }} href="/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                All categories
              </TrackedLink>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { name: 'Botanical', image: '/images/homepage/botanical.avif', desc: 'Discover nature-inspired pieces that bring organic beauty and tranquility to your space.' },
              { name: 'Illustrations', image: '/images/homepage/illustration.avif', desc: 'Playful, characterful, and full of charm — our illustration pieces blend Scandinavian wit with bold, contemporary style.' },
              { name: 'Abstract', image: '/images/homepage/abstract.avif', desc: 'Explore contemporary abstract art that adds modern sophistication to your home.' },
            ].map(cat => {
              const landing = getCategoryLandingByCategory(cat.name);
              return (
              <TrackedLink key={cat.name} event="homepage-section-click" eventData={{ section: 'category-tile', target: cat.name }} href={landing ? `/category/${landing.slug}` : `/products?category=${cat.name}`} className="group cursor-pointer">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 rounded mb-4">
                  <Image src={cat.image} alt={`${cat.name} Category`} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-all duration-300 group-hover:scale-[1.02]" />
                </div>
                <h3 className="text-lg font-medium mb-2">{cat.name}</h3>
                <p className="text-muted-foreground text-sm">{cat.desc}</p>
              </TrackedLink>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <TrackedLink event="homepage-section-click" eventData={{ section: 'view-all-products', target: '/products' }} href="/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
              View all products
            </TrackedLink>
          </div>
        </div>
      </section>

      <QualityPromise />
      <Testimonials />
      <FullWidthImage />

      {/* Meet the artists: homepage door-in to the /artists hub and artist pages */}
      {featuredArtists.length > 0 && (
        <section className="container mx-auto px-8 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between gap-6 mb-8">
              <h2 className="text-3xl font-normal text-neutral-900">Meet the artists</h2>
              <TrackedLink
                event="homepage-section-click"
                eventData={{ section: 'meet-the-artists', target: '/artists' }}
                href="/artists"
                className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors whitespace-nowrap"
              >
                View all artists →
              </TrackedLink>
            </div>
            <ArtistsList artists={featuredArtists} />
          </div>
        </section>
      )}

      {/* From the journal: the homepage's first internal link into the journal/content pages */}
      {latestArticles.length > 0 && (
        <section className="container mx-auto px-8 py-16">
          <div className="flex items-center justify-between gap-6 mb-8">
            <h2 className="text-3xl font-normal text-neutral-900">From the journal</h2>
            <TrackedLink
              event="homepage-section-click"
              eventData={{ section: 'from-the-journal', target: '/journal' }}
              href="/journal"
              className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors whitespace-nowrap"
            >
              Read the journal →
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
            url: BASE_URL,
            description: 'Curated selection of exquisite Nordic artwork and prints from talented Scandinavian artists.',
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
