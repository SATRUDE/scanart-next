import React from 'react';
import Image from 'next/image';
import { Button, ContentSection, TextLink } from '@/components/v2/ui';
import { ArtistCard, type ArtistCardData } from '@/components/v2/artists/ArtistCard';
import { HeadlineWithWindows, type HeadlinePart, type WindowPool } from './HeadlineWithWindows';

export interface AboutPlace {
  /** The city as the map and the list label it. */
  label: string;
  /** Marker position, as a percentage of the map's width and height; null when the city is not on the map. */
  x: number | null;
  y: number | null;
  artists: string[];
}

export interface AboutCopy {
  locale: 'en' | 'no';
  headline: HeadlinePart[];
  pools: Record<WindowPool, string[]>;
  about: {
    heading: string;
    paragraphs: string[];
    figure: { src: string; alt: string; caption: string };
    cta: { label: string; href: string };
    link: { label: string; href: string };
  };
  howItWorks: { heading: string; rows: { title: string; body: string }[] };
  where: { heading: string; places: AboutPlace[] };
  statement: { quote: string; attribution: string };
  artists: { heading: string; paragraphs: string[]; link: { label: string; href: string } };
  roster: { heading: string; all: { label: string; href: string }; cards: ArtistCardData[]; hrefPrefix: string };
  cta: { heading: string; body: string; label: string; href: string };
}

/**
 * About (Figma: About · desktop 162:285, About · mobile 187:2310).
 *
 * The copy the page carried before V2 is all here: the H1 ("Bringing
 * Scandinavian art into homes around the world"), both Content sections word
 * for word, and the links to the collection and the journal. What V2 adds is
 * the windows in the headline, How the shop works, the map, one real customer
 * quote on the moss band, the artists and the apply call to action.
 *
 * The page keeps a catalogue picture with its artist-named alt (lib/about-hero)
 * as a Figure in the first section, because /about is the site's second
 * biggest image-search page and the sitemap declares that image for it.
 */
export function AboutBody({ copy }: { copy: AboutCopy }) {
  return (
    <div className="pb-section">
      {/* Hero: the title is the whole hero, set low on the first screen
          (layout.md: it fits the first screen at 1440 × 900). */}
      <section className="page-x flex flex-col justify-end pt-[120px] pb-6 tab:min-h-[max(560px,calc(100svh-124px))] tab:pt-block tab:pb-24">
        <HeadlineWithWindows parts={copy.headline} pools={copy.pools} className="tab:max-w-[1100px]" />
      </section>

      <div className="page-x">
        <ContentSection
          id="about"
          className="mt-section"
          title={copy.about.heading}
          footer={
            <>
              <Button href={copy.about.cta.href}>{copy.about.cta.label}</Button>
              <TextLink href={copy.about.link.href} size="body" arrow={false}>{copy.about.link.label}</TextLink>
            </>
          }
        >
          {copy.about.paragraphs.map(p => (
            <p key={p} className="type-body tab:max-w-[624px]">{p}</p>
          ))}
          <figure className="flex flex-col gap-tight tab:max-w-[624px]">
            <div className="relative aspect-square w-full overflow-hidden bg-image-bg">
              <Image src={copy.about.figure.src} alt={copy.about.figure.alt} fill sizes="(max-width: 833px) 100vw, 624px" className="object-cover object-[50%_30%]" />
            </div>
            <figcaption className="type-caption">{copy.about.figure.caption}</figcaption>
          </figure>
        </ContentSection>

        <HowItWorks heading={copy.howItWorks.heading} rows={copy.howItWorks.rows} />
        <WhereTheArtistsWork heading={copy.where.heading} places={copy.where.places} />
      </div>

      <Statement quote={copy.statement.quote} attribution={copy.statement.attribution} />

      <div className="page-x">
        <ContentSection
          id="working-with-artists"
          className="mt-section"
          title={copy.artists.heading}
          footer={<TextLink href={copy.artists.link.href} size="body" arrow={false}>{copy.artists.link.label}</TextLink>}
        >
          {copy.artists.paragraphs.map(p => (
            <p key={p} className="type-body tab:max-w-[624px]">{p}</p>
          ))}
        </ContentSection>
      </div>

      <Roster {...copy.roster} />

      <div className="page-x">
        <section aria-labelledby="are-you-an-artist" className="page-grid mt-section gap-y-6 border-t border-ink pt-4 tab:pt-group">
          <h2 id="are-you-an-artist" className="col-span-full type-h2 desk:col-span-6 desk:type-h1">{copy.cta.heading}</h2>
          <div className="col-span-full flex flex-col items-start gap-group desk:col-span-5 desk:col-start-7">
            <p className="type-body">{copy.cta.body}</p>
            <Button href={copy.cta.href}>{copy.cta.label}</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * How the shop works: heading on 4 columns, Index rows on 8. The rows here are
 * the 8-column variant (Figma 12:125: numeral 1, title 3, body 4), which the
 * shared IndexRow (laid across all 12) cannot take, so they are drawn here.
 * One numbered set, so the numerals are the section's one peach moment.
 */
function HowItWorks({ heading, rows }: { heading: string; rows: { title: string; body: string }[] }) {
  return (
    <section aria-labelledby="how-the-shop-works" className="page-grid mt-section gap-y-6">
      <div className="col-span-full border-t border-ink pt-4 tab:pt-group desk:col-span-4">
        <h2 id="how-the-shop-works" className="type-h2">{heading}</h2>
      </div>
      <ol className="col-span-full desk:col-span-8">
        {rows.map((row, i) => (
          <li
            key={row.title}
            className="flex flex-col gap-2 border-t border-ink pt-3 pb-10 tab:pt-group tab:pb-block desk:grid desk:grid-cols-8 desk:gap-x-[var(--sa-gutter)]"
          >
            <p aria-hidden className="type-h3 text-text-accent desk:col-span-1">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="type-h3 desk:col-span-3">{row.title}</h3>
            <p className="type-body desk:col-span-4">{row.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Where the artists work (Figma Map 241:4047): the places, each with its
 * artists, on 4 columns, and the Nordic line map on 8. On mobile the map comes
 * first and the places follow as fact rows. The places are derived from the
 * artists with published prints, so the map never shows a city with nobody in
 * the shop. The map is decorative: the list says the same thing in words.
 */
function WhereTheArtistsWork({ heading, places }: { heading: string; places: AboutPlace[] }) {
  return (
    <section aria-labelledby="where-the-artists-work" className="page-grid mt-section gap-y-6 desk:grid-rows-[auto_1fr]">
      <div className="col-span-full border-t border-ink pt-4 tab:pt-group desk:col-span-4 desk:row-start-1">
        <h2 id="where-the-artists-work" className="type-h2">{heading}</h2>
      </div>
      <div aria-hidden className="col-span-full desk:col-span-8 desk:col-start-5 desk:row-span-2 desk:row-start-1 desk:border-t desk:border-ink desk:pt-group">
        <div className="relative aspect-[843/1053] w-full">
          <Image src="/images/map/nordics.svg" alt="" fill unoptimized className="select-none" />
          {places.filter(place => place.x !== null).map(place => (
            <span
              key={place.label}
              className="absolute flex -translate-y-1/2 items-center gap-[4px] tab:gap-[6px]"
              style={{ left: `calc(${place.x}% - 1.5px)`, top: `${place.y}%` }}
            >
              <span className="size-[3px] shrink-0 rounded-full bg-ink tab:size-[7px]" />
              <span className="h-px w-[5px] shrink-0 bg-brand tab:w-3" />
              <span className="bg-bg px-[2px] type-caption tab:px-1 tab:type-small">{place.label}</span>
            </span>
          ))}
        </div>
      </div>
      <ul className="col-span-full desk:col-span-4 desk:row-start-2 desk:mt-block">
        {places.map(place => (
          <li key={place.label} className="flex gap-4 border-t border-ink py-[10px] tab:py-3 desk:flex-col desk:gap-0">
            <span className="w-[110px] shrink-0 type-body desk:w-auto">{place.label}</span>
            <span className="min-w-0 flex-1 type-body desk:type-small">{place.artists.join(', ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Statement · nature (Figma 27:110): the page's one full-bleed block, moss
 * close up, blurred with grain; the quote in the top corner, the attribution
 * in the bottom corner. The quote is a real customer's, the same one the
 * homepage has carried, not the design's placeholder.
 */
function Statement({ quote, attribution }: { quote: string; attribution: string }) {
  return (
    <figure className="relative mt-section flex h-[520px] flex-col justify-between overflow-hidden bg-inverse px-margin py-10 text-inverse-text tab:mt-section tab:h-[560px] tab:py-[var(--sa-margin)]">
      <Image src="/images/v2/about/statement-moss.webp" alt="" fill sizes="100vw" className="object-cover" />
      <blockquote className="relative mx-auto w-full max-w-[1280px]">
        <p className="type-h2 tab:max-w-[843px]">&ldquo;{quote}&rdquo;</p>
      </blockquote>
      <figcaption className="relative mx-auto w-full max-w-[1280px] type-caption">{attribution}</figcaption>
    </figure>
  );
}

/**
 * The artists, from tablet up (the mobile frame leaves them out): heading and
 * "All artists" on 4 columns, the Artist cards from column 5 running off the
 * right edge, so the row reads as one to scroll.
 */
function Roster({ heading, all, cards, hrefPrefix }: AboutCopy['roster']) {
  if (cards.length === 0) return null;
  return (
    <section aria-labelledby="the-artists" className="page-x mt-section hidden tab:block">
      <div className="page-grid">
        <div className="col-span-full flex flex-col justify-between gap-group border-t border-ink pt-group desk:col-span-4">
          <h2 id="the-artists" className="type-h2">{heading}</h2>
          <div>
            <Button variant="link" href={all.href}>{all.label}</Button>
          </div>
        </div>
        <ul className="col-span-full mt-block flex gap-[var(--sa-gutter)] overflow-x-auto scrollbar-hide desk:col-span-8 desk:mt-0 desk:mr-[calc(-1*(var(--sa-margin)+max(0px,(100vw-1440px)/2)))] desk:pr-[var(--sa-margin)]">
          {cards.map(card => (
            <li key={card.slug} className="w-[405px] shrink-0 border-t border-ink pt-group">
              <ArtistCard artist={card} href={`${hrefPrefix}/artist/${card.slug}`} as="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
