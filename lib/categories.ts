// Category landing pages give each catalogue category one indexable URL of its
// own, instead of living only as a ?category= filter on /products. The `category`
// field must match the Product.category value in the baked catalogue data exactly.
// Shared between app/category/[slug]/page.tsx and app/sitemap.ts so the two never drift.
// Copy drafted by Ken (Studio board, 2026-07-21) and wired verbatim; artist and
// size claims were checked against the live catalogue when written. Since
// 2026-09-26 (Mikko Saarainen and Ishtar Bäcklund Dakhil joining) the copy
// names no counts of artists or prints and no closed list of countries or
// cities (Mark: "I don't want to have to continually update it"). Keep it so.

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
      'Scandinavian botanical prints by independent Nordic artists: folk florals, patterned landscapes and vivid still lifes, framed or unframed.',
    heading: 'Botanical Prints',
    // Ken's buyer-language rewrite (Studio row, 2026-08-13).
    intro:
      'Botanical, in this gallery’s hands, means the natural world as Nordic artists actually live with it. Ingunn Dybendal draws folk flowers and a patterned lakeland in coloured pencil, Helene Brox threads dozens of birds through a soft papercut lattice, and Sia Siamos paints the outdoors arriving at the table: lobster and wine, cabin breakfasts, ripe tomatoes against green tiles. From Sweden, Hedvig Wallin paints rows of watercolour apples. Every botanical print here is made to order and sold framed, wood, black or white, or unframed if you’d rather choose your own.',
    intro2:
      'That range makes botanical prints one of the easiest ways into art for a Scandinavian-style home. White walls and pale wood are a palette waiting for exactly this kind of warmth, and a botanical piece supplies it without tipping the room into clutter. They are independent artists we work with directly, and every piece in the category is printed to order on 200gsm uncoated paper.',
    stylingHeading: 'Styling botanical prints',
    stylingBody:
      'Kitchens and dining spaces are the natural home for Sia Siamos’s table scenes; hang one near where you actually eat and it earns its keep daily. The gentler pieces, Tree Top Peach especially, suit bedrooms and reading corners, while Eltsjoen’s dense pattern rewards a wall you pass slowly, a hallway or a landing. Most pieces here share the 50 x 70 cm format, so pairs come easily: try a Dybendal beside a Siamos and let the colours talk.',
    faqs: [
      {
        question: 'Are botanical prints all flowers?',
        answer:
          'Not here. Alongside florals you’ll find a patterned Nordic landscape, birds among branches and vivid kitchen-table still lifes. What unites the category is subject, the natural world and the life lived around it, rather than one single look.',
      },
      {
        question: 'What size are the botanical prints?',
        answer:
          'Most prints in this category are 50 x 70 cm, a forgiving size that works alone above a chest of drawers, or in a pair above a sofa or dining table, and each product page lists the size. Centre pieces at eye level, roughly 145 to 150 cm from the floor.',
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
    title: 'Nordic Abstract Wall Art Prints',
    description:
      'Nordic abstract wall art by independent artists: pared-back figures, bold bird silhouettes and geometric landscapes in confident colour. Framing options.',
    heading: 'Abstract Prints',
    // Ken's buyer-language rewrite (Studio row, 2026-08-13), trimmed when
    // Renate Thor's Birdie series left the catalogue (21 Aug). A print by a
    // new artist is held back until her agreement is signed; the version with
    // it is on branch ishtar/preview (docs/v2-launch.md).
    intro:
      'Nordic abstraction leans to clarity rather than chaos: forms pared back until only the essential shape is left, one or two flat colours doing the work of ten. Helene Brox paints her loose, cut-out figures in Oslo, and cuts a diving swallow down to the plunge of its wings. If you’re looking to buy Scandinavian abstract art prints with real presence, this is the confident end of the gallery, and you choose the frame on each product page: wood, black, white or none at all.',
    intro2:
      'Modern Scandinavian wall art of this kind suits rooms that are already close to calm. If your space leans minimalist, pale wood, quiet textiles, plenty of light, an abstract print gives the eye one confident place to land without shouting over the room. And because the compositions are simple, they read from across the room as well as they do up close.',
    stylingHeading: 'Styling abstract prints',
    stylingBody:
      'One large abstract can carry a feature wall alone; hang it with the centre of the piece roughly 145 to 150 cm from the floor. Helene Brox’s pieces share a flat-colour language, so a pair hung side by side reads as one deliberate gesture rather than two unrelated prints. Pick a print whose ground colour echoes something already in the room, a cushion, a rug, a run of book spines, and the wall clicks into place.',
    faqs: [
      {
        question: 'What makes abstract art Scandinavian?',
        answer:
          'Mostly restraint. Where much abstract art piles on texture and gesture, the Nordic strain simplifies: flat colour, clean silhouettes, and forms that trace back to nature, birds, bodies, water. Every abstract print here is by an independent artist living and working in the Nordics.',
      },
      {
        question: 'What sizes do the abstract prints come in?',
        answer:
          'Helene Brox’s pieces are all printed at 50 x 70 cm, which is a generous single-print size. As a rule of thumb, 50 x 70 cm holds a sofa or bed wall on its own, and a pair of them fills a wider wall without needing a third.',
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
      'Nordic illustration prints by independent artists: dry one-liners, comic pages packed with detail and imagined worlds. Framed or unframed.',
    heading: 'Illustrations',
    // Ken's buyer-language rewrite (Studio row, 2026-08-13), rewritten again
    // on 2026-09-15 for the second and third illustrator in the category.
    intro:
      'Illustration here means drawings with a sense of humour, and the category pulls in two directions. Simen Wahlqvist, in Oslo, catches a moment just before it happens in as few lines as possible; his rule is that a drawing is done when it makes him laugh. Mikko Saarainen, in Lahti, works the opposite way, filling a square until every corner has a joke in it, and one of his prints is a whole comic page. Hedvig Wallin’s ink seascape sits between them. If you’re after a Nordic art print that gets a second look from every guest, start here: each piece can be bought framed or unframed, and the black frame does the square prints a particular favour.',
    intro2:
      'This is the characterful end of Nordic art, and an easy first print to buy. It suits hallways, home offices, children’s rooms and any room that has come out a little too tasteful and needs one thing with a glint in its eye. They are independent artists we work with directly, from across the Nordics, and every print is made on 200gsm uncoated paper.',
    stylingHeading: 'Styling illustration prints',
    stylingBody:
      'Many of these prints are 50 x 50 cm, and the square format is quietly useful: it sits well on a picture shelf, holds a narrow wall a rectangle would crowd, and makes a tidy pair or trio along a hallway. The larger pieces, Morgenstrekk and Journey among them, work as the anchor of a group with the squares around them. Keep the frame choice consistent across a set, all wood, all black or all white, and the mix reads as intentional. Saarainen’s squares are the loudest thing in the category, so give them a wall that can take it.',
    faqs: [
      {
        question: 'What makes these illustrations Scandinavian?',
        answer:
          'Partly the economy: Nordic illustration favours as few lines as necessary and no more, letting white space and a limited palette do the heavy lifting, which is Simen Wahlqvist’s whole method. Mikko Saarainen is the counter-example, and the region holds both: Finland has a long comic and children’s-book tradition that fills the page instead. These are drawn by artists living and working in the Nordics, so the label is literal as well as stylistic.',
      },
      {
        question: 'What sizes do the illustration prints come in?',
        answer:
          'Many are 50 x 50 cm squares, and the rest come in larger formats; each product page lists the size. The squares suit shelves, hallways and grouped walls, while the larger pieces can hold a wall on their own.',
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
