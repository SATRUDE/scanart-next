import React from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import { ProductActions } from '@/components/ProductActions';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';
import { PrintCard } from '@/components/PrintCard';
import { sizeLabel } from '@/components/v2/product/artist-facts';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import { FeedbackIntercept } from '@/components/FeedbackIntercept';
import { Breadcrumb, FactRow, Meta, Question, SectionHeader, TextLink } from '@/components/v2/ui';
import { ProductReadMore } from '@/components/v2/product/ReadMore';
import { LocalPrice } from '@/components/v2/product/LocalPrice';
import type { Product } from '@/contexts/CartContext';
import type { Artist } from '@/data/artists';
import type { ProductImage } from '@/lib/product-image-alt';
import type { ProductVideo } from '@/config/product-videos';
import { getLowestProductPrices, type CurrencyPrices } from '@/lib/pricing';
import type { CrossLinksStrings, ProductActionsStrings } from '@/lib/i18n';
import { fill, type GalleryStrings, type ProductPageStrings } from '@/lib/product-page-copy';

export interface ProductViewProps {
  locale: 'en' | 'no';
  product: Product;
  images: ProductImage[];
  video?: ProductVideo;
  /** The catalogue description in the page's language. */
  description: string;
  /** The Merchant Center trial's listing summary, where the print has one. */
  listingSummary?: string;
  categoryLabel: string;
  /** The category landing this print belongs to, for "All illustrations". */
  categoryLink?: { href: string; label: string };
  artist: (Artist & { location: string; bio: string }) | null;
  artistStatement?: string;
  /** The artist's published prints, for the fact rows. */
  artistFacts?: { sizes: string[]; count: number; lowestPrices: CurrencyPrices };
  recommended: Product[];
  exploreArtists: { slug: string; name: string }[];
  strings: ProductPageStrings;
  galleryStrings?: GalleryStrings;
  actionsStrings?: ProductActionsStrings;
  crossLinksStrings?: CrossLinksStrings;
  outOfStockLabel?: string;
}

/**
 * The V2 product page body (Figma 116:379 desktop, 187:1609 mobile), shared by
 * /product/[slug] and /no/product/[slug]. The pages keep everything search
 * reads that is not body copy: metadata, the product meta tags and both
 * JSON-LD blocks stay in the page files, next to the data they describe.
 *
 * Top: the gallery on eight columns (two images of four) and the panel on
 * four. The panel carries the visible breadcrumb, the H1 (the product name,
 * H3 size on desktop, Mobile/H1 on mobile), the price, artist and category,
 * the description and listing summary (clamped by CSS only), the buying
 * controls, and the Details / Delivery / About rows as native <details>, so
 * their answers are in the HTML.
 *
 * Then, a section apart each: the artist (statement on eight columns, name,
 * full bio, fact rows and link on four), "More prints like this" (was "You may
 * also like"), and Explore the shop.
 */
export function ProductView({
  locale,
  product,
  images,
  video,
  description,
  listingSummary,
  categoryLabel,
  categoryLink,
  artist,
  artistStatement,
  artistFacts,
  recommended,
  exploreArtists,
  strings: t,
  galleryStrings,
  actionsStrings,
  crossLinksStrings,
  outOfStockLabel,
}: ProductViewProps) {
  const prefix = locale === 'no' ? '/no' : '';
  const artistName = artist?.name || product.artist || product.brand;
  const artistHref = artist ? `${prefix}/artist/${artist.slug}` : undefined;
  const sizes = Object.entries(product.sizes ?? {})
    .filter(([, available]) => available)
    .map(([size]) => sizeLabel(size));
  const deliveryHref = `${prefix}/delivery`;

  return (
    <div className="page-x tab:pt-8">
      <div className="page-grid gap-y-6 tab:gap-y-block">
        <div className="col-span-full desk:col-span-8">
          <ProductImageGalleryWrapper
            images={images}
            productName={product.name}
            video={video}
            videoLabel={video?.label[locale]}
            strings={galleryStrings}
          />
        </div>

        <div className="col-span-full flex flex-col gap-group tab:col-span-6 desk:col-span-4">
          <div className="flex flex-col gap-4">
            <Breadcrumb
              locale={locale}
              items={[
                { label: t.breadcrumbHome, href: prefix || '/' },
                { label: t.breadcrumbPrints, href: `${prefix}/products` },
                { label: product.name },
              ]}
            />
            <div className="flex flex-col gap-1">
              <h1 className="type-h1 tab:type-h3">{product.name}</h1>
              <p className="type-body">
                <LocalPrice prices={getLowestProductPrices(product)} />
              </p>
              <Meta
                className="type-small"
                items={[
                  artistHref ? (
                    <TrackedLink key="a" event="artist-link-click" eventData={{ artist: artist?.slug }} href={artistHref} className="transition-colors hover:text-brand">
                      {artistName}
                    </TrackedLink>
                  ) : (
                    artistName
                  ),
                  categoryLink ? (
                    <TrackedLink key="c" event="category-link-click" eventData={{ from: product.slug, to: categoryLink.href }} href={categoryLink.href} className="transition-colors hover:text-brand">
                      {categoryLabel}
                    </TrackedLink>
                  ) : (
                    categoryLabel
                  ),
                ]}
              />
            </div>
          </div>

          {(description || listingSummary) && (
            <ProductReadMore moreLabel={t.readMore} lessLabel={t.readLess} className="type-body tab:type-small">
              {description && <p>{description}</p>}
              {listingSummary && <p>{listingSummary}</p>}
            </ProductReadMore>
          )}

          <ProductActions product={product} strings={actionsStrings} />
          <FeedbackIntercept placement="product" />

          <div className="flex flex-col">
            <Question question={t.questions.details} size="small" as="h2">
              <p>{fill(t.detailsBody, { sizes: sizes.join(', ') })}</p>
              <p>{t.detailsFrames}</p>
            </Question>
            <Question question={t.questions.delivery} size="small" as="h2">
              <p>{t.deliveryBody}</p>
              <p>{t.returnsBody}</p>
              <p>
                <TextLink href={deliveryHref} size="body">{t.deliveryLink}</TextLink>
              </p>
            </Question>
            {artist && artistHref && (
              <Question question={fill(t.questions.about, { name: artist.name })} size="small" as="h2">
                <p>{artist.location}</p>
                <p>
                  <TextLink href={artistHref} size="body">{fill(t.aboutLink, { name: artist.name })}</TextLink>
                </p>
              </Question>
            )}
          </div>
        </div>
      </div>

      {artist && artistHref && (
        <section aria-labelledby="about-the-artist" className="page-grid mt-section gap-y-6">
          {artistStatement && (
            <div className="col-span-full border-t border-ink pt-4 tab:pt-6 desk:col-span-8">
              <p className="type-h2 tab:type-h1 desk:max-w-[733px]">{artistStatement}</p>
            </div>
          )}
          <div
            className={`col-span-full flex flex-col gap-group tab:col-span-6 desk:col-span-4 desk:border-t desk:border-ink desk:pt-6 ${artistStatement ? 'desk:col-start-9' : 'border-t border-ink pt-4 tab:pt-6'}`}
          >
            <h2 id="about-the-artist" className="type-h3">
              <TrackedLink event="artist-link-click" eventData={{ artist: artist.slug }} href={artistHref} className="transition-colors hover:text-brand">
                {artist.name}
              </TrackedLink>
            </h2>
            {artist.bio && <p className="type-body">{artist.bio}</p>}
            <dl>
              {artist.location && <FactRow label={t.facts.basedIn}>{artist.location}</FactRow>}
              {artistFacts && artistFacts.sizes.length > 0 && (
                <FactRow label={t.facts.sizes}>{artistFacts.sizes.join(', ')}</FactRow>
              )}
              {artistFacts && artistFacts.count > 0 && (
                <FactRow label={t.facts.inTheShop}>
                  {fill(artistFacts.count === 1 ? t.facts.printsFromOne : t.facts.printsFromOther, { count: artistFacts.count })}{' '}
                  <LocalPrice prices={artistFacts.lowestPrices} />
                </FactRow>
              )}
            </dl>
            <TextLink href={artistHref} size="body" arrow={false}>
              {artistFacts && artistFacts.count > 1 ? fill(t.allPrintsOther, { count: artistFacts.count }) : t.allPrintsOne}
            </TextLink>
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section aria-labelledby="more-prints" className="mt-section">
          <SectionHeader id="more-prints" title={t.moreLikeThis} link={categoryLink ? { href: categoryLink.href, label: fill(t.allInCategory, { label: categoryLink.label.toLowerCase() }) } : undefined} />
          {/* Desktop: three columns, top edges aligned, each print at its own
              ratio. Mobile: one row that runs off the right edge. */}
          <ul className="-mr-margin mt-block flex gap-3 overflow-x-auto scrollbar-hide tab:mr-0 tab:grid tab:grid-cols-2 tab:gap-x-gutter tab:gap-y-block tab:overflow-visible desk:grid-cols-3">
            {recommended.map(rec => (
              <li key={rec.id} className="w-[240px] shrink-0 tab:w-auto">
                <TrackedLink event="related-product-click" eventData={{ from: product.slug, to: rec.slug }} href={`${prefix}/product/${rec.slug}`}>
                  <PrintCard
                    product={rec}
                    locale={locale}
                    sizes="(max-width: 833px) 240px, (max-width: 1199px) 50vw, 405px"
                    {...(outOfStockLabel ? { outOfStockLabel } : {})}
                  />
                </TrackedLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LandingCrossLinks
        className="mt-section mb-section"
        locale={locale}
        artists={exploreArtists}
        {...(crossLinksStrings ? { strings: crossLinksStrings } : {})}
      />
    </div>
  );
}
