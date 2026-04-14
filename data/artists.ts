export interface Artist {
  id: string;
  name: string;
  location: string;
  bio: string;
  image: string;
}

export const artists: Artist[] = [
  {
    id: '1',
    name: 'Helene Brox',
    location: 'Oslo, Norway',
    bio: 'Helene Brox is an artist and illustrator based in Oslo, Norway.',
    image: '/images/artists/helene-brox.png'
  },
  {
    id: '2',
    name: 'Simen Wahlqvist',
    location: 'Oslo, Norway',
    bio: 'Simen Wahlqvist is a Norwegian graphic designer and illustrator based in Oslo. In his work he aims to capture moments, often before they happen, with as few lines as possible. If an illustration makes himself laugh, it means its done!',
    image: '/images/artists/simen.png'
  },
  {
    id: '3',
    name: 'Renate Thor',
    location: 'Trondheim, Norway',
    bio: 'Renate Thor is an Oslo-based illustrator, artist and graphic artist. She is known for her playful artworks and illustrations, using bold colours and compositions. She is driven by the process of her craft, allowing it to guide her to the result through free and playful experimentation. She works with screen printing for her artworks, using paper stencils and bold colored ink to create her unusual compositions. She loves the unpredictability of layering and blending in screen printing techniques, and imitates some of the same principles in her illustration work. Renate is a graduate of Westerdals School Of Communication, and has an MA in illustration from Oslo National Academy Of The Arts.',
    image: '/images/artists/renate.png'
  },
  {
    id: '4',
    name: 'Ingunn Dybendal',
    location: 'Oslo, Norway',
    bio: 'Ingunn Dybendal is an artist and illustrator based in Oslo, Norway.',
    image: '/images/artists/ingunn-dybendal.png'
  },
  {
    id: '5',
    name: 'Sia Siamos',
    location: 'Bergen, Norway',
    bio: 'Athanasia Siamos is a Greek and Norwegian illustrator living in Bergen.',
    image: '/images/artists/sia-siamos.png'
  },
  {
    id: '6',
    name: 'Nils Andersson',
    location: 'Malmö, Sweden',
    bio: 'A contemporary artist whose work bridges traditional Scandinavian craftsmanship with modern aesthetic sensibilities. His pieces tell stories of heritage and innovation.',
    image: '/images/artists/nils-andersson.png'
  }
];

export const getArtistById = (id: string) => {
  return artists.find(artist => artist.id === id);
}; 