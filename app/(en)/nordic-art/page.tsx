import type { Metadata } from 'next';
import Link from 'next/link';
import { nordicArtLanding } from '@/lib/nordic-art';
import { getAllProducts } from '@/lib/products';
import { artists } from '@/data/artists';
import { getPublishedArtists } from '@/lib/published-artists';
import { ContentSection, ContentBody } from '@/components/v2/ui';
import { LandingTemplate } from '@/components/v2/landing/LandingTemplate';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts();

  return {
    // Absolute for the same reason as /scandinavian-wall-art: the layout's
    // "| Scandinavian Art Gallery" suffix would truncate the query the page
    // targets past Google's ~60-char display cut.
    title: { absolute: nordicArtLanding.title },
    description: nordicArtLanding.description,
    alternates: {
      canonical: '/nordic-art',
    },
    ...socialCard({
      title: nordicArtLanding.title,
      description: nordicArtLanding.description,
      path: '/nordic-art',
      image: products[0]?.image,
    }),
  };
}

// English only: /nordic-art has no Norwegian twin and no hreflang (docs/v2-seo.md).
export default async function NordicArtPage() {
  const products = await getAllProducts();
  const published = await getPublishedArtists();
  // Roster order, but only artists with a published print: an artist whose
  // prints are all held back has no page, so a link here would 404.
  const listed = artists.filter(a => published.some(p => p.slug === a.slug));
  const path = '/nordic-art';

  return (
    <LandingTemplate
      heading={nordicArtLanding.heading}
      intro={[nordicArtLanding.intro, nordicArtLanding.intro2]}
      breadcrumb={[{ label: 'Prints', href: '/products' }, { label: nordicArtLanding.heading }]}
      products={products}
      countLabel={`${products.length} ${products.length === 1 ? 'print' : 'prints'}`}
      fromLabel="from"
      printsHeading="Prints"
      faqHeading="Common questions"
      faqs={nordicArtLanding.faqs}
      crossLinks={{ current: { type: 'nordic-art', slug: 'nordic-art' } }}
      artists={published}
      jsonLd={[
        faqPageJsonLd(nordicArtLanding.faqs),
        collectionPageJsonLd({ name: nordicArtLanding.title, description: nordicArtLanding.description, path, locale: 'en', products }),
        landingBreadcrumbJsonLd({ locale: 'en', homeName: 'Home', productsName: 'Art Prints', name: nordicArtLanding.heading, path }),
      ]}
    >
      {/* Where /scandinavian-wall-art routes by room, this page routes by
          artist: the query family is about the art itself, and the artist
          pages are the site's best-ranking documents, so they get the links. */}
      <ContentSection id="the-artists" title="The artists" className="mt-section">
        <ContentBody>
          <p>
            Every print here comes from one of the gallery&apos;s artists, each with their own page of
            work and background:{' '}
            {listed.map((artist, i) => (
              <span key={artist.slug}>
                <Link href={`/artist/${artist.slug}`} className="transition-colors hover:text-ink">{artist.name}</Link>
                {i < listed.length - 2 ? ', ' : i === listed.length - 2 ? ' and ' : '.'}
              </span>
            ))}
          </p>
        </ContentBody>
      </ContentSection>

      <ContentSection id="framed" title={nordicArtLanding.framedHeading} className="mt-section">
        <ContentBody>
          <p>{nordicArtLanding.framedBody}</p>
        </ContentBody>
      </ContentSection>
    </LandingTemplate>
  );
}
