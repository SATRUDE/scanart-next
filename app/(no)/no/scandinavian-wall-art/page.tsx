import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllProducts } from '@/lib/products';
import { getPublishedArtists } from '@/lib/published-artists';
import { ContentSection, ContentBody } from '@/components/v2/ui';
import { LandingTemplate } from '@/components/v2/landing/LandingTemplate';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd } from '@/lib/landing-jsonld';
import { socialCard } from '@/lib/site';
import { hreflangPair } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';

// The Norwegian wall-art landing: app/scandinavian-wall-art/page.tsx mirrored,
// with copy from lib/i18n/no.ts. The slug stays English on purpose (Mark's
// standing rule) while the copy targets what a Norwegian actually searches for.
const t = no.wallArt;

export async function generateMetadata(): Promise<Metadata> {
  const products = await getAllProducts();

  return {
    // Absolute, as on the English page: the layout's brand suffix would push
    // this past Google's ~60-char display cut.
    title: { absolute: t.title },
    description: t.description,
    alternates: {
      canonical: '/no/scandinavian-wall-art',
      languages: hreflangPair('/scandinavian-wall-art'),
    },
    ...socialCard({
      title: t.title,
      description: t.description,
      path: '/no/scandinavian-wall-art',
      image: products[0]?.image,
      ogLocale: 'nb_NO',
    }),
  };
}

export default async function NorwegianWallArtPage() {
  const products = await getAllProducts();
  const artists = await getPublishedArtists();
  const path = '/no/scandinavian-wall-art';

  return (
    <LandingTemplate
      locale="no"
      heading={t.heading}
      intro={[t.intro, t.intro2]}
      breadcrumb={[{ label: no.shared.prints, href: '/no/products' }, { label: t.heading }]}
      products={products}
      countLabel={`${products.length} ${t.printsSuffix}`}
      fromLabel={no.shared.fromPrice}
      printsHeading={t.printsSrHeading}
      outOfStockLabel={no.shared.outOfStock}
      readMoreLabel={no.shared.readMore}
      readLessLabel={no.shared.readLess}
      faqHeading={t.commonQuestions}
      faqs={t.faqs}
      crossLinks={{ current: { type: 'wall-art', slug: 'scandinavian-wall-art' }, strings: no.crossLinks }}
      artists={artists}
      jsonLd={[
        faqPageJsonLd(t.faqs, 'nb-NO'),
        collectionPageJsonLd({ name: t.title, description: t.description, path, locale: 'no', inLanguage: 'nb-NO', products }),
        landingBreadcrumbJsonLd({ locale: 'no', homeName: no.shared.home, productsName: t.breadcrumbPrints, name: t.heading, path }),
      ]}
    >
      <ContentSection id="framed" title={t.framedHeading} className="mt-section">
        <ContentBody>
          <p>{t.framedBody}</p>
        </ContentBody>
      </ContentSection>

      <ContentSection id="room-by-room" title={t.stylingHeading} className="mt-section">
        <ContentBody>
          {/* JSX rather than one config string so the room mentions carry real
              internal links to the Norwegian collection landings. */}
          <p>
            {t.styling.p1}
            <Link href="/no/collection/living-room" className="transition-colors hover:text-ink">{t.styling.livingRoomLink}</Link>
            {t.styling.p2}
            <Link href="/no/collection/bedroom" className="transition-colors hover:text-ink">{t.styling.bedroomLink}</Link>
            {t.styling.p3}
            <Link href="/no/collection/home-office" className="transition-colors hover:text-ink">{t.styling.homeOfficeLink}</Link>
            {t.styling.p4}
          </p>
        </ContentBody>
      </ContentSection>
    </LandingTemplate>
  );
}
