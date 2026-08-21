export interface Artist {
  id: string;
  name: string;
  slug: string;
  location: string;
  bio: string;
  image: string;
}

export const artists: Artist[] = [
  {
    id: '1',
    name: 'Helene Brox',
    slug: 'helene-brox',
    location: 'Oslo, Norway',
    bio: 'Helene Brox is an illustrator, hand letterer and mural painter based in Oslo, and a founding member of the illustration agency Heiaklubben. Her book covers won silver and a diploma at Norway\u2019s \u00c5rets vakreste b\u00f8ker in 2016, and she invents wholly unreal grafted plants to sell as prints.',
    image: '/images/artists/helene-brox.png'
  },
  {
    id: '2',
    name: 'Simen Wahlqvist',
    slug: 'simen-wahlqvist',
    location: 'Oslo, Norway',
    bio: 'Simen Wahlqvist is a Norwegian graphic designer and illustrator based in Oslo. In his work he aims to capture moments, often before they happen, with as few lines as possible. If an illustration makes himself laugh, it means its done!',
    image: '/images/artists/simen.png'
  },
  {
    id: '4',
    name: 'Ingunn Dybendal',
    slug: 'ingunn-dybendal',
    location: 'Oslo, Norway',
    bio: 'Ingunn Dybendal is an illustrator living and working in Oslo, part of the Heiaklubben collective, with an illustration degree from Falmouth. Her work runs from a Google Doodle to a 360 square metre wall in Hamar, and her motto is more is more is more is more.',
    image: ''
  },
  {
    id: '5',
    name: 'Sia Siamos',
    slug: 'sia-siamos',
    location: 'Bergen, Norway',
    bio: 'Sia Siamos is a half Greek, half Norwegian illustrator living in Bergen, with a soft spot for still life, food and everyday moments. She came to illustration from graphic design, drawn to the quiet details that say the most, and works digital or analogue as the subject asks.',
    image: '/images/artists/sia-siamos.png'
  },
];

export const getArtistById = (id: string) => {
  return artists.find(artist => artist.id === id);
};

export const getArtistBySlug = (slug: string) => {
  return artists.find(artist => artist.slug === slug);
};

export const getArtistInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}; 