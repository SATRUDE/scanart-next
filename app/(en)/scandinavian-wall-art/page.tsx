import type { Metadata } from 'next';
import Link from 'next/link';
import { wallArtLanding } from '@/lib/wall-art';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { ContentSection, ContentBody } from '@/components/v2/ui';
import { LandingTemplate } from '@/components/v2/landing/LandingTemplate';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts();

  return {
    // Absolute: the layout's "| Scandinavian Art Gallery" template would push
    // this past Google's ~60-char display cut and truncate the UK modifier the
    // page targets ('nordic wall art uk' is the cluster's best position).
    title: { absolute: wallArtLanding.title },
    description: wallArtLanding.description,
    alternates: {
      canonical: '/scandinavian-wall-art',
      languages: hreflangPair('/scandinavian-wall-art'),
    },
    ...socialCard({
      title: wallArtLanding.title,
      description: wallArtLanding.description,
      path: '/scandinavian-wall-art',
      image: products[0]?.image,
    }),
  };
}

export default async function ScandinavianWallArtPage() {
  const products = await getAllProducts();
  const artists = await getPublishedArtists();
  const path = '/scandinavian-wall-art';

  return (
    <LandingTemplate
      heading={wallArtLanding.heading}
      intro={[wallArtLanding.intro, wallArtLanding.intro2]}
      breadcrumb={[{ label: 'Prints', href: '/products' }, { label: wallArtLanding.heading }]}
      products={products}
      countLabel={`${products.length} ${products.length === 1 ? 'print' : 'prints'}`}
      fromLabel="from"
      printsHeading="Prints"
      faqHeading="Common questions"
      faqs={wallArtLanding.faqs}
      crossLinks={{ current: { type: 'wall-art', slug: 'scandinavian-wall-art' } }}
      artists={artists}
      jsonLd={[
        faqPageJsonLd(wallArtLanding.faqs),
        collectionPageJsonLd({ name: wallArtLanding.title, description: wallArtLanding.description, path, locale: 'en', products }),
        landingBreadcrumbJsonLd({ locale: 'en', homeName: 'Home', productsName: 'Art Prints', name: wallArtLanding.heading, path }),
      ]}
    >
      {/* The framing offer as its own section: it is the heart of the buying
          queries this page is aimed at, so it gets a heading rather than a
          clause (Ken's retarget, 2026-08-13). */}
      <ContentSection id="framed" title={wallArtLanding.framedHeading} className="mt-section">
        <ContentBody>
          <p>{wallArtLanding.framedBody}</p>
        </ContentBody>
      </ContentSection>

      <ContentSection id="room-by-room" title={wallArtLanding.stylingHeading} className="mt-section">
        <ContentBody>
          {/* Rendered as JSX rather than a config string so the room mentions can
              carry real internal links to the collection landings. Copy by Ken. */}
          <p>
            Where the print will hang decides which one to buy. In the living room, one confident piece
            should anchor the sofa wall, and the{' '}
            <Link href="/collection/living-room" className="transition-colors hover:text-ink">living room collection</Link>{' '}
            gathers the prints with that kind of presence. The bedroom rewards the softer end of the
            gallery, muted botanicals and quiet abstracts you&apos;re happy to wake up to, collected in the{' '}
            <Link href="/collection/bedroom" className="transition-colors hover:text-ink">bedroom edit</Link>.
            The home office suits the catalogue&apos;s dry wit, a Wahlqvist illustration hung in your eyeline
            from the desk, and there&apos;s a{' '}
            <Link href="/collection/home-office" className="transition-colors hover:text-ink">home office page</Link>{' '}
            for exactly that. Wherever it hangs, centre the piece at roughly 145 to 150 cm from the floor.
          </p>
        </ContentBody>
      </ContentSection>
    </LandingTemplate>
  );
}
