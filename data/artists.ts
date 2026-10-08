export interface Artist {
  id: string;
  name: string;
  slug: string;
  location: string;
  bio: string;
  image: string;
  /** The photographer, where the artist's photo must be credited. */
  imageCredit?: string;
  /** The artist's own shop for signed or limited originals (Mark, 29 Sep 2026). */
  originalsUrl?: string;
}

export const artists: Artist[] = [
  {
    id: '2',
    name: 'Simen Wahlqvist',
    slug: 'simen-wahlqvist',
    location: 'Oslo, Norway',
    bio: 'Simen Wahlqvist is a Norwegian graphic designer and illustrator based in Oslo. In his work he aims to capture moments, often before they happen, with as few lines as possible. If an illustration makes him laugh, it’s done.',
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
    bio: 'Ishtar Bäcklund Dakhil is a Swedish illustrator and visual artist with an MFA in Visual Communication from Konstfack. Her picture books have been published by Natur och Kultur and Seven Stories Press, and have received a BolognaRagazzi Award and a New York Public Library Best Book designation. She leads workshops around the world where personal stories are expressed through visual and narrative storytelling and grow into collectively made artworks. Her originals are hand painted in watercolour, natural pigments and mixed media.',
    image: '/images/artists/ishtar-backlund-dakhil.png',
    // Branch peggy/ishtar-artist-preview: the photo credit must be shown.
    imageCredit: 'Sebastian Lundmark',
  },
  {
    id: '9',
    name: 'Markus Naarttijärvi',
    slug: 'markus-naarttijarvi',
    location: 'Umeå, Sweden',
    // Verified 28 September 2026: https://www.naarttijarvi.com/about
    bio: 'Markus Naarttijärvi is a documentary photographer based in Umeå, Sweden. His long-term projects follow industry, nature and culture in northern Sweden, exploring solitude, perseverance and the passage of time.',
    // Portrait supplied by Markus 2 Oct 2026. No photographer credit given, so none shown.
    image: '/images/artists/markus-naarttijarvi.png',
  },
  {
    id: '10',
    name: 'Patrik Wennerlund',
    slug: 'patrik-wennerlund',
    location: 'Borås, Sweden',
    // Patrik's own words from his email of 2 October 2026, lightly edited into the
    // third person (Mark, 6 Oct 2026); no facts added.
    bio: 'Patrik Wennerlund is an art director and photographer, and the owner of PWM AB / PWMFoto. He has worked in advertising and marketing for most of his life, and photography has always played a central role in his work, both as a client and as an image maker across advertising, editorial and other communication. In 2011 he bought his first real system camera to try something new, and travel and photography proved an unbeatable combination. On his many journeys he captures objects, nature, buildings and beings, and transforms them into alluring artworks. His aim is to create images he would like to hang on his own wall. His work has been exhibited several times.',
    // Portrait supplied by Patrik 4 Oct 2026. No photographer credit given, so none shown.
    image: '/images/artists/patrik-wennerlund.jpg',
    // Signed and limited editions (Mark, 29 Sep 2026); Mark, 6 Oct 2026: link www.pwmfoto.com.
    originalsUrl: 'https://www.pwmfoto.com',
  },
  {
    id: '11',
    name: 'Emma Iben',
    slug: 'emma-iben',
    location: 'Copenhagen, Denmark',
    // Emma's own wording, from her email of 4 October 2026 (first two sentences, only the
    // grammar touched), plus a last sentence taken from her artist application of
    // 31 August 2026 ("melodramatic and humoristic drawings", "tricky bodies, abnormal
    // sizes and tangles"). Portrait supplied by Emma the same day; no credit given, so none shown.
    bio: 'Emma Iben is an illustrator, graphic designer and motion designer based in Copenhagen, Denmark. She creates visual material for album covers, posters, tattoos, educational resources, fictional short films and public service TV, professionally as well as for fun. Her drawings are melodramatic and humorous, and convey emotional experiences through recurring motifs of tricky bodies, abnormal sizes and tangles.',
    image: '/images/artists/emma-iben.jpg',
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