import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist, getArtistInitials } from '@/data/artists';

interface ArtistSectionProps {
  artist: Artist;
}

export const ArtistSection: React.FC<ArtistSectionProps> = ({ artist }) => {
  return (
    <div className="mt-16 pt-8 border-t">
      <div className="flex items-start gap-4">
        {artist.image ? (
          <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
            <Image src={artist.image} alt={artist.name} width={48} height={48} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div aria-hidden="true" className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-muted-foreground">{getArtistInitials(artist.name)}</span>
          </div>
        )}
        <div>
          <h2 className="font-medium">
            <Link href={`/artist/${artist.slug}`} className="hover:text-neutral-600 transition-colors">
              {artist.name}
            </Link>
          </h2>
          {artist.location && <p className="text-sm text-muted-foreground">{artist.location}</p>}
          {artist.bio && <p className="text-sm text-muted-foreground mt-2">{artist.bio}</p>}
        </div>
      </div>
    </div>
  );
};
