import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Artist, getArtistInitials } from '@/data/artists';

export interface ArtistWithCount extends Artist {
  printCount: number;
}

interface ArtistsListProps {
  artists: ArtistWithCount[];
}

// A single editorial column: one row per artist, small circular avatar (or an
// initials fallback when there is no portrait), name, location + print count,
// and a short bio. The whole row links to the artist's detail page.
export const ArtistsList: React.FC<ArtistsListProps> = ({ artists }) => {
  return (
    <ul>
      {artists.map(artist => (
        <li key={artist.id} className="border-b border-border last:border-0">
          <Link
            href={`/artist/${artist.slug}`}
            className="group flex items-center gap-5 py-6"
          >
            {artist.image ? (
              <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                <Image src={artist.image} alt={artist.name} fill sizes="64px" className="object-cover" />
              </div>
            ) : (
              <div aria-hidden="true" className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-base font-medium text-muted-foreground">{getArtistInitials(artist.name)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-medium text-neutral-900 transition-colors group-hover:text-neutral-600">
                {artist.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {artist.location} · {artist.printCount} {artist.printCount === 1 ? 'print' : 'prints'}
              </p>
              {artist.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
};
