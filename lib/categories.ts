// Category landing pages give each catalogue category one indexable URL of its
// own, instead of living only as a ?category= filter on /products. The `category`
// field must match the Product.category value in the baked catalogue data exactly.
// Shared between app/category/[slug]/page.tsx and app/sitemap.ts so the two never drift.
// Copy drafted by Ken (Studio board, 2026-07-21) and wired verbatim; artist and
// size claims were checked against the live catalogue when written. The
// illustrations intro leans on Simen being the sole illustrator, revisit it if
// a second illustrator joins the catalogue.

export interface CategoryLanding {
  slug: string;
  category: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  intro2: string;
  stylingHeading: string;
  stylingBody: string;
  faqs: { question: string; answer: string }[];
}

export const categoryLandings: CategoryLanding[] = [
  {
    slug: 'botanical',
    category: 'Botanical',
    title: 'Botanical Art Prints',
    description:
      'Scandinavian botanical prints: folk florals, patterned Nordic landscapes and vivid still lifes by independent Norwegian artists. Framing options, worldwide delivery.',
    heading: 'Botanical Prints',
    intro:
      'Botanical, in this gallery’s hands, means more than flowers in a vase, though Ingunn Dybendal’s Trysilkaffe gives you exactly that: a mug of wildly patterned blooms in joyful folk colour. It means the natural world as Nordic artists actually live with it. Dybendal’s Eltsjoen turns mountain, water and forest into dense, jewel-bright pattern; Helene Brox’s Tree Top Peach fills its frame with birds among branches in a soft papercut style; and Sia Siamos paints what happens when the outdoors reaches the table: cabin breakfasts, ripe tomatoes and grapes, a carafe of water against green kitchen tiles.',
    intro2:
      'That range makes botanical prints one of the easiest ways into art for a Scandinavian-style home. White walls and pale wood are a palette waiting for exactly this kind of warmth, and a botanical piece supplies it without tipping the room into clutter. All three are independent artists working in Norway, and every piece in the category is produced to museum standard.',
    stylingHeading: 'Styling botanical prints',
    stylingBody:
      'Kitchens and dining spaces are the natural home for Sia Siamos’s table scenes; hang one near where you actually eat and it earns its keep daily. The gentler pieces, Tree Top Peach especially, suit bedrooms and reading corners, while Eltsjoen’s dense pattern rewards a wall you pass slowly, a hallway or a landing. Everything here shares the same 50 x 70 cm format, so pairs come easily: try a Dybendal beside a Siamos and let the colours talk.',
    faqs: [
      {
        question: 'Are botanical prints all flowers?',
        answer:
          'Not here. Alongside florals you’ll find a patterned Nordic landscape, birds among branches and vivid kitchen-table still lifes. What unites the category is subject, the natural world and the life lived around it, rather than one single look.',
      },
      {
        question: 'What size are the botanical prints?',
        answer:
          'Every print in this category is 50 x 70 cm, a forgiving size that works alone above a chest of drawers, or in a pair above a sofa or dining table. Centre pieces at eye level, roughly 145 to 150 cm from the floor.',
      },
      {
        question: 'Can I order a botanical print framed?',
        answer:
          'Yes. Choose unframed, or a wood, black or white frame, on each product page. Prints are made to order and delivered worldwide, with delivery costs shown at checkout.',
      },
    ],
  },
  {
    slug: 'abstract',
    category: 'Abstract',
    title: 'Abstract Art Prints',
    description:
      'Nordic abstract wall art from independent Norwegian artists: pared-back figures and bold bird motifs in confident flat colour. Framing options, worldwide delivery.',
    heading: 'Abstract Prints',
    intro:
      'Abstract art in the Nordic tradition leans towards clarity rather than chaos: forms pared back until only the essential shape is left, one or two flat colours doing the work of ten. The prints in this collection carry that sensibility. Helene Brox paints loose, cut-out-like figures in cream on a single field of colour, a dancer mid-stride, a swallow caught in its dive, while Renate Thor’s Birdie series, rooted in her screen-printing practice, turns a flock of birds into bold, rhythmic pattern across four colourways. Both are independent Norwegian artists working in Oslo.',
    intro2:
      'Modern Scandinavian wall art of this kind suits rooms that are already close to calm. If your space leans minimalist, pale wood, quiet textiles, plenty of light, an abstract print gives the eye one confident place to land without shouting over the room. And because the compositions are simple, they read from across the room as well as they do up close.',
    stylingHeading: 'Styling abstract prints',
    stylingBody:
      'One large abstract can carry a feature wall alone; hang it with the centre of the piece roughly 145 to 150 cm from the floor. The Birdie prints are made for grouping: a pair or a row of three reads as one deliberate gesture, because each colourway shares the same composition. Pick a print whose ground colour echoes something already in the room, a cushion, a rug, a run of book spines, and the wall clicks into place.',
    faqs: [
      {
        question: 'What makes abstract art Scandinavian?',
        answer:
          'Mostly restraint. Where much abstract art piles on texture and gesture, the Nordic strain simplifies: flat colour, clean silhouettes, and forms that trace back to nature, birds, bodies, water. Every abstract print here is by an independent Norwegian artist.',
      },
      {
        question: 'What sizes do the abstract prints come in?',
        answer:
          'Renate Thor’s Birdie prints come in A3, A2 and A1; Helene Brox’s pieces are printed at 50 x 70 cm. As a rule of thumb, go A1 or 50 x 70 cm above a sofa or bed, and A3 for shelves and smaller walls.',
      },
      {
        question: 'Can I buy abstract prints framed?',
        answer:
          'Yes. Every print can be ordered unframed or in a wood, black or white frame, chosen on the product page. We deliver worldwide, with delivery costs shown at checkout.',
      },
    ],
  },
  {
    slug: 'illustrations',
    category: 'Illustrations',
    title: 'Scandinavian Illustrations',
    description:
      'Characterful Scandinavian illustration prints by Oslo illustrator Simen Wahlqvist: few lines, dry wit, clean colour. Framing options and worldwide delivery.',
    heading: 'Illustrations',
    intro:
      'Every illustration print here is, for now, the work of one artist: Simen Wahlqvist, an Oslo-based graphic designer and illustrator who sets out to capture a moment, often just before it happens, in as few lines as possible. By his own rule, if a drawing makes him laugh, it’s done. It shows. Morgenstrekk catches that first full-body stretch of the morning, and the square prints around it carry the same dry wit, each built from a handful of confident lines and one or two colours.',
    intro2:
      'This is the clean-lined, characterful end of Scandinavian art, and an easy first print to buy. It suits hallways, home offices and any room that has come out a little too tasteful and needs one thing with a glint in its eye. Simen is one of the independent Norwegian artists behind the gallery, and his prints are made on archival, museum-level paper.',
    stylingHeading: 'Styling illustration prints',
    stylingBody:
      'Most of these prints are 50 x 50 cm, and the square format is quietly useful: it sits well on a picture shelf, holds a narrow wall a rectangle would crowd, and makes a tidy pair or trio along a hallway. Morgenstrekk, at 50 x 70 cm, works as the anchor of a group with the squares around it. Keep the frame choice consistent across a set, all wood, all black or all white, and the mix reads as intentional.',
    faqs: [
      {
        question: 'What makes these illustrations Scandinavian?',
        answer:
          'The economy. Nordic illustration favours as few lines as necessary and no more, letting white space and a limited palette do the heavy lifting. These are drawn in Oslo by a Norwegian illustrator, so the label is literal as well as stylistic.',
      },
      {
        question: 'What sizes do the illustration prints come in?',
        answer:
          'Most are 50 x 50 cm square; Morgenstrekk is 50 x 70 cm. The squares suit shelves, hallways and grouped walls, while the larger piece can hold a wall on its own.',
      },
      {
        question: 'Can I get an illustration print framed and delivered abroad?',
        answer:
          'Yes. Every print can be ordered unframed or in a wood, black or white frame, and we deliver worldwide. Delivery costs appear at checkout.',
      },
    ],
  },
];

export function getCategoryLandingBySlug(slug: string): CategoryLanding | undefined {
  return categoryLandings.find(c => c.slug === slug);
}

// Map a catalogue category value (e.g. "Botanical") to its landing page, so the
// homepage, nav and products filter all link to /category/<slug> consistently.
export function getCategoryLandingByCategory(category: string): CategoryLanding | undefined {
  return categoryLandings.find(c => c.category === category);
}
