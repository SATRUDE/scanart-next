import type React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumb, Hairline, SectionHeader, ContentSection, FactRow } from '@/components/v2/ui';
import { PrintCard } from '@/components/PrintCard';
import { LandingCrossLinks } from '@/components/LandingCrossLinks';
import type { CrossLinksStrings } from '@/lib/i18n';
import type { CurrencyPrices } from '@/lib/pricing';
import { ArtistCardList, type ArtistCardData } from './ArtistCard';
import { ArtistMap } from './ArtistMap';
import { FromPrice } from './FromPrice';

// Ken's editorial paragraphs carry inline links in Markdown form
// ([text](/path)); render them as real <Link>s, everything else as text.
function renderInlineLinks(text: string): React.ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      return (
        <Link key={i} href={match[2]} className="transition-colors hover:text-brand">
          {match[1]}
        </Link>
      );
    }
    return part;
  });
}

type Product = React.ComponentProps<typeof PrintCard>['product'] & { slug: string };

/** A tile's height relative to its width: square, tall 5:7 or landscape 5:4, plus the caption. */
function tileHeight(product: Product): number {
  const m = (Object.keys(product.prices)[0] ?? '').match(/^(\d+)x(\d+)cm$/i);
  const ratio = m ? Number(m[2]) / Number(m[1]) : 7 / 5;
  return ratio + 0.2;
}

/**
 * Deal the prints into `n` columns, tallest first onto the shortest column, then
 * restore catalogue order inside each column and order the columns by their
 * first print, so the list still reads roughly in catalogue order.
 */
function columns(products: Product[], n: number): { product: Product; index: number }[][] {
  const cols = Array.from({ length: n }, () => ({ height: 0, items: [] as { product: Product; index: number }[] }));
  const byHeight = products.map((product, index) => ({ product, index })).sort((a, b) => tileHeight(b.product) - tileHeight(a.product) || a.index - b.index);
  for (const item of byHeight) {
    const shortest = cols.reduce((lo, col) => (col.height < lo.height ? col : lo), cols[0]);
    shortest.items.push(item);
    shortest.height += tileHeight(item.product);
  }
  return cols
    .map(col => col.items.sort((a, b) => a.index - b.index))
    .filter(items => items.length > 0)
    .sort((a, b) => a[0].index - b[0].index);
}

export interface ArtistProfileProps {
  locale: 'en' | 'no';
  slug: string;
  name: string;
  bio: string;
  location: string;
  portrait?: string;
  initials: string;
  breadcrumb: { label: string; href?: string }[];
  products: Product[];
  /** "5 prints" */
  printCount: string;
  lowest: CurrencyPrices | null;
  hero: { src: string; alt: string; href: string; title: string; note: string } | null;
  editorial?: { heading: string; para1: string; para2: string };
  facts: { label: string; value: React.ReactNode }[];
  map: { city: string; label: string; caption: string } | null;
  more: ArtistCardData[];
  explore: { slug: string; name: string }[];
  t: {
    printsBy: string;
    from: string;
    atAGlance: string;
    moreArtists: string;
    allArtists: string;
    allArtistsHref: string;
    productHref: (slug: string) => string;
    categoryLabels?: Record<string, string>;
    outOfStock?: string;
    crossLinks?: CrossLinksStrings;
  };
}

/**
 * The V2 artist profile (Figma 199:1621 desktop, 201:1750 mobile, and the other
 * six artists' frames), shared by /artist/[slug] and /no/artist/[slug] so the
 * two can never drift: the pages own the data, the metadata and the JSON-LD;
 * this owns the layout.
 *
 * Sections, top to bottom, 192 apart on desktop (96 on mobile):
 *  - Hero 5 + 7: breadcrumb, the H1 (the artist's name, docs/v2-seo.md), city
 *    and "n prints, from £x", the full bio (it must stay visible: the bio is
 *    the page's own copy, and the V2 frames drop it), the toned portrait at the
 *    foot; a room scene on the other 7 columns with its caption.
 *  - "Prints by {name}": the h2 the contract keeps, the print count on the
 *    right, and the prints as one continuous three-column list (layout rule 13:
 *    each tile at its own ratio, 64 under the one above).
 *  - The editorial section, Ken's copy with its inline links.
 *  - "At a glance": fact rows from the data, and the map of where they work.
 *  - "More artists": the other artists' cards.
 *  - Explore the shop.
 */
export function ArtistProfile(p: ArtistProfileProps) {
  const hrefPrefix = p.locale === 'no' ? '/no' : '';
  const line = (
    <p className="flex flex-wrap items-center gap-[6px] type-small">
      <span>{p.location}</span>
      <Hairline />
      <span>
        {p.printCount}
        {p.lowest && (
          <>
            {', '}
            <FromPrice prices={p.lowest} from={p.t.from} />
          </>
        )}
      </span>
    </p>
  );

  const portrait = (size: 'small' | 'large') => (
    <div className={`relative shrink-0 overflow-hidden bg-image-bg ${size === 'large' ? 'size-[120px]' : 'size-[72px]'}`}>
      {p.portrait ? (
        <Image src={p.portrait} alt={p.name} fill sizes="120px" className="object-cover" />
      ) : (
        <div aria-hidden className="flex size-full items-center justify-center border border-ink bg-bg type-h3">{p.initials}</div>
      )}
    </div>
  );

  return (
    <div className="page-x pb-section">
      {/* Hero · 5 + 7 */}
      <section className="page-grid gap-y-6 pt-10 tab:pt-band">
        <div className="col-span-full flex flex-col justify-between gap-group desk:col-span-5">
          <div className="flex flex-col gap-4 tab:gap-group">
            <Breadcrumb items={p.breadcrumb} locale={p.locale} />
            {/* Mobile puts the portrait beside the name; desktop pins it to the foot of the column. */}
            <div className="flex items-center gap-4 desk:block">
              <div className="desk:hidden">{portrait('small')}</div>
              <h1 className="type-h1 tab:type-display min-w-0 flex-1">{p.name}</h1>
            </div>
            {line}
            {p.bio && <p className="type-body tab:max-w-[624px] desk:max-w-none">{p.bio}</p>}
          </div>
          <div className="hidden desk:block">{portrait('large')}</div>
        </div>
        {p.hero && (
          <figure className="col-span-full -mx-margin flex flex-col gap-tight tab:mx-0 desk:col-span-7">
            <div className="relative h-[460px] w-full overflow-hidden bg-image-bg tab:h-[700px]">
              {/* The hero scene is the LCP candidate on a profile, so it is preloaded. */}
              <Image src={p.hero.src} alt={p.hero.alt} fill priority sizes="(max-width: 1199px) 100vw, 733px" className="object-cover" />
            </div>
            <figcaption className="flex items-center gap-[6px] px-margin type-caption tab:px-0">
              <Link href={p.hero.href} className="transition-colors hover:text-brand">{p.hero.title}</Link>
              <Hairline />
              <span>{p.hero.note}</span>
            </figcaption>
          </figure>
        )}
      </section>

      {/* Prints by {name} */}
      <section aria-labelledby="prints-by" className="mt-section flex flex-col gap-group tab:gap-band">
        <div className="flex items-baseline justify-between gap-6 border-t border-ink pt-4 tab:pt-6">
          <h2 id="prints-by" className="type-h2">{p.t.printsBy} {p.name}</h2>
          <p className="shrink-0 type-small">{p.printCount}</p>
        </div>
        {/* Layout rule 13: one continuous list in three columns, each tile at
            its own ratio and 64 under the one above, columns balanced by height
            so they end close to one line. Mobile stacks the columns in turn. */}
        <div className="flex flex-col gap-10 tab:grid tab:grid-cols-3 tab:items-start tab:gap-x-gutter">
          {columns(p.products, 3).map((column, c) => (
            <ul key={c} className="flex flex-col gap-10 tab:gap-band">
              {column.map(({ product, index }) => (
                <li key={product.id}>
                  <Link href={p.t.productHref(product.slug)} className="block">
                    {/* the first four are above the fold on a short hero: preload them */}
                    <PrintCard
                      product={product}
                      priority={index < 4}
                      sizes="(max-width: 833px) 100vw, (max-width: 1199px) 33vw, 405px"
                      categoryLabel={p.t.categoryLabels?.[product.category]}
                      outOfStockLabel={p.t.outOfStock}
                      locale={p.locale}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* About the work: Ken's editorial, verbatim, with its inline links. */}
      {p.editorial && (
        <ContentSection id="about-the-work" title={p.editorial.heading} className="mt-section">
          <div className="flex flex-col gap-6 type-body tab:max-w-[624px] [&_a]:text-text-accent">
            <p>{renderInlineLinks(p.editorial.para1)}</p>
            <p>{renderInlineLinks(p.editorial.para2)}</p>
          </div>
        </ContentSection>
      )}

      {/* At a glance · 4 + 8: facts under the heading, the map on the other 8. */}
      <section aria-labelledby="at-a-glance" className="mt-section page-grid gap-y-6">
        <div className="col-span-full flex flex-col gap-group border-t border-ink pt-4 tab:gap-8 tab:pt-6 desk:col-span-4">
          <h2 id="at-a-glance" className="type-h2">{p.t.atAGlance}</h2>
          <dl>
            {p.facts.map((fact, i) => (
              <FactRow key={i} label={fact.label} first={i === 0} className={i > 0 ? '!border-ink' : ''}>
                {fact.value}
              </FactRow>
            ))}
          </dl>
        </div>
        {p.map && (
          <div className="col-span-full desk:col-span-8 desk:border-t desk:border-ink desk:pt-6">
            <ArtistMap city={p.map.city} label={p.map.label} caption={p.map.caption} />
          </div>
        )}
      </section>

      {/* More artists: the other artists with published prints. */}
      {p.more.length > 0 && (
        <section aria-labelledby="more-artists" className="mt-section flex flex-col gap-group tab:gap-band">
          <SectionHeader id="more-artists" title={p.t.moreArtists} link={{ href: p.t.allArtistsHref, label: p.t.allArtists }} />
          <ArtistCardList artists={p.more} hrefPrefix={hrefPrefix} as="h3" />
        </section>
      )}

      <LandingCrossLinks
        className="mt-section"
        current={{ type: 'page', slug: `artist/${p.slug}` }}
        strings={p.t.crossLinks}
        locale={p.locale}
        artists={p.explore}
      />
    </div>
  );
}
