import React from 'react';
import { Artist } from '@/data/artists';

interface ArtistSectionProps {
  artist: Artist;
}

export const ArtistSection: React.FC<ArtistSectionProps> = ({ artist }) => {
  return (
    <div className="mt-16 pt-8 border-t">
      <div className="flex items-start gap-4">
        {artist.image && (
          <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
            <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h3 className="font-medium">{artist.name}</h3>
          {artist.location && <p className="text-sm text-muted-foreground">{artist.location}</p>}
          {artist.bio && <p className="text-sm text-muted-foreground mt-2">{artist.bio}</p>}
        </div>
      </div>
    </div>
  );
};
