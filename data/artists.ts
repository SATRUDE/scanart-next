export interface Artist {
  id: string;
  name: string;
  slug: string;
  location: string;
  bio: string;
  image: string;
  /** The photographer, where the artist's photo must be credited. */
  imageCredit?: string;
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
  {
    id: '6',
    name: 'Hedvig Wallin',
    slug: 'hedvig-wallin',
    location: 'Gothenburg, Sweden',
    bio: 'Hedvig Wallin is an illustrator and graphic designer from Gothenburg, Sweden, who began illustrating children’s books at eighteen and still does, alongside editorial work, murals, logos, labels and posters. She draws on naive art for its childlike simplicity, mixing ink, pencil, soft pastel, watercolour and digital media into playful, detail-rich images with a wonky perspective, where something new turns up each time you look.',
    image: '/images/artists/hedvig-wallin.png'
  },
  {
    id: '7',
    name: 'Mikko Saarainen',
    slug: 'mikko-saarainen',
    location: 'Lahti, Finland',
    bio: 'Mikko Saarainen is an award-winning illustrator, children\'s author and comic artist from Lahti, Finland. His pictures are funny, expressive and packed with detail: a cruise ship where every passenger has spotted something different, a family car loaded past the roofline, a knight losing an argument with a dragon. He works in a bold line and flat, faintly grainy colour, and keeps the detail going right out to the edges, so the drawings get read as much as looked at.',
    image: '/images/artists/mikko-saarainen.png'
  },
  {
    id: '8',
    name: 'Ishtar Bäcklund Dakhil',
    slug: 'ishtar-backlund-dakhil',
    location: 'Stockholm, Sweden',
    bio: 'Ishtar Bäcklund Dakhil is a Swedish artist working across illustration, murals and design. She spent five years travelling and competing internationally in downhill skateboarding before studying at Konstfack in Stockholm.',
    image: '/images/artists/ishtar-backlund-dakhil.png',
    // Branch peggy/ishtar-artist-preview: the photo credit must be shown.
    imageCredit: 'Sebastian Lundmark',
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