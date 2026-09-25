import Link from 'next/link';
import Image from 'next/image';
import { Hairline } from '@/components/v2/ui';

export interface ArtistCardData {
  slug: string;
  name: string;
  /** Toned portrait, or undefined for the initials square. */
  portrait?: string;
  initials: string;
  /** The bio, clamped to three lines with CSS only, so the whole text stays
   *  in the HTML as it did in the old ArtistsList (docs/v2-seo.md). */
  about: string;
  city: string;
  /** "5 prints" / "5 trykk". */
  prints: string;
}

/**
 * Artist card (Figma 61:199) from tablet up: 4 columns, rule on top, toned
 * portrait, name in H3, the bio clamped to three lines, and city with the print count
 * pinned to the bottom so a row shares one baseline. On mobile it is the Artist
 * row (Figma 258:3945, Size=Mobile): portrait on the left, text beside it.
 *
 * The whole card is the link. The name is a heading (h2 on /artists, where the
 * cards sit directly under the H1; h3 under "More artists"), which is what the
 * old ArtistsList did too. Portrait alt is the artist's name (docs/v2-seo.md).
 */
export function ArtistCard({ artist, href, as: Heading = 'h2', priority = false }: { artist: ArtistCardData; href: string; as?: 'h2' | 'h3'; priority?: boolean }) {
  return (
    <Link
      href={href}
      className="group/card flex h-full gap-4 pb-6 tab:min-h-[380px] tab:flex-col tab:justify-between tab:gap-group tab:pb-0"
    >
      <div className="flex min-w-0 flex-1 gap-4 tab:flex-none tab:flex-col tab:gap-group">
        <div className="relative size-16 shrink-0 overflow-hidden bg-image-bg tab:size-14">
          {artist.portrait ? (
            <Image src={artist.portrait} alt={artist.name} fill sizes="64px" priority={priority} className="object-cover" />
          ) : (
            <div aria-hidden className="flex size-full items-center justify-center border border-ink bg-bg type-body tab:font-serif tab:text-[22px]">
              {artist.initials}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-[6px] tab:gap-group">
          <Heading className="type-h3 transition-colors group-hover/card:text-brand">{artist.name}</Heading>
          <p className="line-clamp-3 type-small tab:type-body">{artist.about}</p>
          <p className="flex items-center gap-[6px] type-caption tab:hidden">
            <span>{artist.city}</span>
            <Hairline />
            <span>{artist.prints}</span>
          </p>
        </div>
      </div>
      <p className="hidden items-center gap-[6px] type-caption tab:flex">
        <span>{artist.city}</span>
        <Hairline />
        <span>{artist.prints}</span>
      </p>
    </Link>
  );
}

/**
 * The cards as a list: one column of rows on mobile (a rule between rows, none
 * above the first because a heading's rule sits there), two columns on tablet
 * and three (4 + 4 + 4) on desktop, each card under its own rule.
 */
export function ArtistCardList({ artists, hrefPrefix, as, priorityCount = 0 }: { artists: ArtistCardData[]; hrefPrefix: string; as?: 'h2' | 'h3'; priorityCount?: number }) {
  return (
    <ul className="grid gap-y-0 tab:grid-cols-2 tab:gap-x-gutter tab:gap-y-band desk:grid-cols-3">
      {artists.map((artist, i) => (
        <li key={artist.slug} className="border-t border-ink pt-4 first:border-t-0 first:pt-0 tab:pt-group tab:first:border-t tab:first:pt-group">
          <ArtistCard artist={artist} href={`${hrefPrefix}/artist/${artist.slug}`} as={as} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
