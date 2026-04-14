import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/products';
import { HeroSection } from '@/components/HeroSection';
import { QualityPromise } from '@/components/QualityPromise';
import { Testimonials } from '@/components/Testimonials';
import { FullWidthImage } from '@/components/FullWidthImage';

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="min-h-screen">
      <HeroSection products={featuredProducts} />

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
              <Link href="/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
                All categories
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { name: 'Botanical', image: '/images/homepage/botanical.avif', desc: 'Discover nature-inspired pieces that bring organic beauty and tranquility to your space.' },
              { name: 'Illustrations', image: '/images/homepage/illustration.avif', desc: 'Playful, characterful, and full of charm — our illustration pieces blend Scandinavian wit with bold, contemporary style.' },
              { name: 'Abstract', image: '/images/homepage/abstract.avif', desc: 'Explore contemporary abstract art that adds modern sophistication to your home.' },
            ].map(cat => (
              <Link key={cat.name} href={`/products?category=${cat.name}`} className="group cursor-pointer">
                <div className="aspect-[4/5] overflow-hidden bg-neutral-50 rounded mb-4">
                  <img src={cat.image} alt={`${cat.name} Category`} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]" />
                </div>
                <h3 className="text-lg font-medium mb-2">{cat.name}</h3>
                <p className="text-muted-foreground text-sm">{cat.desc}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/products" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900 h-10 px-4 py-2">
              View all products
            </Link>
          </div>
        </div>
      </section>

      <QualityPromise />
      <Testimonials />
      <FullWidthImage />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Scandinavian Art Gallery',
            url: 'https://www.scandinavianart.co.uk',
            description: 'Curated selection of exquisite Nordic artwork and prints from talented Scandinavian artists.',
            publisher: {
              '@type': 'Organization',
              name: 'Scandinavian Art Gallery',
              url: 'https://www.scandinavianart.co.uk',
              logo: 'https://www.scandinavianart.co.uk/images/scandinavian-art-gallery-og.png',
            },
          }),
        }}
      />
    </div>
  );
}
