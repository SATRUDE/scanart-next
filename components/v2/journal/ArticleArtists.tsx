import Image from 'next/image';
import { TrackedLink } from '@/components/TrackedLink';
import { Hairline } from '@/components/v2/ui';
import type { PublishedArtist } from '@/lib/published-artists';

/** The bio's first sentence: the "one line" of the Artist row. */
function firstSentence(bio: string): string {
  const m = bio.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : bio).trim();
}

const initials = (name: string) => name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

/**
 * "The artists in this article" (Figma Article 75:220, Artist row 258:3945):
 * the makers of the prints featured in the piece, each a row under a rule with
 * a toned portrait (or initials), the name, the bio's first line, then city and
 * print count, linking to the artist's page. Desktop sits on the text column;
 * mobile drops the line and the arrow. Only artists with published prints, as
 * everywhere else, since only they have a page.
 */
export function ArticleArtists({ artists, articleSlug, locale = 'en' }: { artists: PublishedArtist[]; articleSlug: string; locale?: 'en' | 'no' }) {
  if (artists.length === 0) return null;
  // Articles are English only today; the prefix keeps the block right if a
  // Norwegian article template ever mounts it.
  const prefix = locale === 'no' ? '/no' : '';
  return (
    <section aria-labelledby="article-artists">
      <h2 id="article-artists" className="border-t border-ink pt-4 pb-4 type-h3 tab:py-6">
        The artists in this article
      </h2>
      <ul>
        {artists.map(artist => (
          <li key={artist.id} className="border-t border-ink first:border-t-0 tab:first:border-t">
            <TrackedLink
              href={`${prefix}/artist/${artist.slug}`}
              event="article-artist-click"
              eventData={{ article: articleSlug, artist: artist.slug }}
              className="group flex items-start gap-[14px] py-4 tab:gap-gutter tab:pt-6 tab:pb-block"
            >
              <span className="relative block size-12 shrink-0 overflow-hidden bg-image-bg tab:size-14 desk:mr-[21px]">
                {artist.image ? (
                  <Image src={artist.image} alt={artist.name} fill sizes="56px" className="object-cover grayscale" />
                ) : (
                  <span aria-hidden className="flex size-full items-center justify-center border border-ink bg-bg font-serif text-[22px]">
                    {initials(artist.name)}
                  </span>
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-tight">
                <span className="type-body transition-colors group-hover:text-brand tab:type-h3">{artist.name}</span>
                <span className="hidden type-body tab:block">{firstSentence(artist.bio)}</span>
                <span className="flex items-center gap-[6px] type-caption">
                  <span>{artist.location.split(',')[0]}</span>
                  <Hairline />
                  <span>
                    {artist.printCount} {artist.printCount === 1 ? 'print' : 'prints'}
                  </span>
                </span>
              </span>
              <span aria-hidden className="hidden type-h3 transition-colors group-hover:text-brand tab:block">→</span>
            </TrackedLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
