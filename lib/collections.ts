// Collection landing pages are curated, cross-cutting selections of the catalogue
// that own query families the category pages don't, e.g. "scandinavian living
// room wall art". Unlike category pages, the selection is hand-picked:
// `productSlugs` lists the prints to feature, in order, so we stay in full
// control of what shows (no thin or accidental grids).
// Shared between app/collection/[slug]/page.tsx, app/sitemap.ts and the /products
// filter row so the three never drift.
//
// Why new browse axes land HERE rather than as categories (2026-08-17): a
// category is driven by the product's single-valued `category` field, so it is
// exclusive, and at 20 prints promoting a subject empties its parents (Birds
// would have taken Abstract from 8 to 3 and Botanical from 7 to 2, at or under
// the floor a landing needs). Collections are non-exclusive, so a print can sit
// in Botanical and in Kitchen at once, which is what the catalogue's size wants.

export interface Collection {
  slug: string;
  /** Short label for the /products filter chip. */
  chipLabel: string;
  /** Which browse axis this sits on: what the art IS, or where it hangs. Drives
   *  the chip order (subjects before rooms) and the filter-click analytics. */
  axis: 'subject' | 'room';
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** Second intro paragraph. Brings the room pages up to the category pages'
   *  content depth (they carry an intro2 too); drafted by Ken. */
  intro2: string;
  /** Curated prints, in display order. Must match Product.slug exactly. */
  productSlugs: string[];
  stylingHeading: string;
  stylingTips: string[];
  /** Optional illustrated version of the styling tips (label + tip + image). When
   *  present, the collection page renders image cards instead of the plain list. */
  stylingCards?: { label: string; tip: string; image: string; alt: string }[];
  /** Contextual interlink to a related journal article, if one fits. */
  relatedArticleSlug?: string;
  relatedArticleLabel?: string;
  /** Room-specific FAQs, rendered as a "Common questions" section plus FAQPage
   *  JSON-LD, matching the category landing pages. Drafted by Ken; facts limited
   *  to the site's verified framing/delivery/size facts. */
  faqs: { question: string; answer: string }[];
}

export const collections: Collection[] = [
  {
    // Labelled for the axis, not just today's contents: every print here is
    // currently a bird, and the H1 and copy say so, but the chip and the URL
    // are the durable parts (Mark, 2026-08-17) and renaming a live collection
    // costs a redirect. An animal print widens the heading, never the slug.
    slug: 'birds-and-animals',
    chipLabel: 'Birds & Animals',
    axis: 'subject',
    title:
      'Scandinavian Bird Wall Art & Prints',
    description:
      'Nordic bird wall art from Norwegian artists: Renate Thor\'s four Birdie colourways, Helene Brox\'s cobalt swallows and peach branches. Framed or unframed.',
    heading:
      'Bird Wall Art from Nordic Artists',
    intro:
      'Every bird here is a shape before it\'s a bird. Renate Thor\'s Birdie flock comes out of her screen-printing practice, paper stencils and flat ink, four colourways of the same tumbling crowd. Helene Brox works flatter still: a cobalt swallow cut down to the plunge of its wings, or dozens of small silhouettes hidden in a peach lattice of branches. That\'s what makes a bird print sit well in a Scandinavian room, pattern and silhouette rather than field-guide detail. All six can be bought framed in wood, black or white, or unframed.',
    intro2:
      'Birds are also one of the few subjects you can happily buy twice. The four Birdie colourways are the same composition in different moods, so a pair or a trio reads as a set without having to match anything else in the room, while the two Brox prints are quite capable of holding a wall alone. Choose on the ground colour rather than the birds: petrol blue and emerald run cool, rose pink and dark chocolate run warm, and Tree Top Peach is the gentlest of the six. Get the background right for the wall and the birds look after themselves.',
    productSlugs: [
      'birdie-blue',
      'birdie-green',
      'birdie-pink',
      'birdie-brown',
      'swallow-dive',
      'tree-top-peach',
    ],
    stylingHeading: 'Styling bird prints',
    stylingTips: [
      'Hang the Birdie colourways as a pair or a trio, same size and same frame, with an even 5 to 8 cm gap so the flock reads as one piece rather than three prints.',
      'A single bird print does better with a wall to itself. Centre it at eye level, roughly 145 to 150 cm off the floor, and leave the space either side empty; the movement in these prints needs somewhere to go.',
      'Match the ground colour to the room, not the birds. Petrol blue and emerald sit happily on white walls and pale wood, while Birdie Brown wants warmth around it: wood, leather, earthy textiles.',
      'Mixing the two artists works if the frames agree. Swallow Dive is only two colours, cobalt on cream, so it\'s quiet enough to hang near a Birdie without either one losing.',
    ],
    relatedArticleSlug: 'create-an-art-wall',
    relatedArticleLabel: 'How to create an art wall with multiple pieces',
    faqs: [
      {
        question: 'What makes a bird print feel Scandinavian?',
        answer:
          'Flat colour and silhouette, mostly. All six prints here treat the bird as a shape rather than a study: Renate Thor packs her flock edge to edge until it reads as pattern first, Helene Brox carries a whole diving swallow in two colours, and Tree Top Peach is closer to a folk papercut than an illustration. Both artists are independent and working in Norway, which is why these read as Nordic bird prints rather than anything out of the wildlife-plate tradition.',
      },
      {
        question: 'Can I buy the Birdie prints as a set?',
        answer:
          'You can buy them individually and group them yourself, which is how most people do it. There are four colourways of the same tumbling flock, blue, green, pink and brown, and all four come in A3, A2 and A1, so it\'s easy to order two or three at a matching size in the same frame. Buying them one at a time also lets you live with the first before you commit to the wall.',
      },
      {
        question: 'What sizes do the bird prints come in, and can I have them framed?',
        answer:
          'The four Birdie prints come in A3, A2 and A1. Swallow Dive and Tree Top Peach come in one size, 50 x 70 cm. Sizes are listed on each product page, where you also choose unframed or a wood, black or white frame, with the price for the size you\'ve picked shown before you add it to the basket. Every print is made to order and delivered worldwide, with the cost shown at checkout.',
      },
    ],
  },
  {
    slug: 'living-room',
    chipLabel: 'Living Room',
    axis: 'room',
    title: 'Scandinavian Living Room Wall Art',
    description:
      'Curated Scandinavian and Nordic wall art for the living room: warm, characterful prints from independent Norwegian artists. Framing options and worldwide delivery.',
    heading: 'Scandinavian Wall Art for the Living Room',
    // Ken's buyer-language rewrite (Studio row, 2026-08-13), written to
    // dovetail with intro2, which owns the morning-light idea.
    intro:
      'The living room wall is the one guests actually look at, so it deserves a print bought on purpose rather than a poster that came with the frame. This edit gathers our Scandinavian wall art with living room presence: Sia Siamos’s warm table scenes, Renate Thor’s Birdie flock, Helene Brox’s bold cream figures among them. Each piece is made to order and can be bought framed, in wood, black or white, or unframed, whichever suits the wall it’s headed for.',
    intro2:
      'It is also the room a print is seen in most, in morning light and lamplight both, so it pays to choose something you will still enjoy on the hundredth glance rather than the first. Scandinavian living room wall art tends to earn that staying power through restraint, confident colour and clean form over busy detail. Start with one piece you are sure of and build the wall around it; a gallery grouping rarely works when it all arrives at once.',
    productSlugs: [
      'tree-top-peach',
      'eltsjoen',
      'vinkveld',
      'hyttefrokost',
      'morgenlevering',
      'birdie-blue',
      'birdie-green',
      'birdie-pink',
      'dancer',
      'swallow-dive',
      'morgenstrekk',
      'slingshot',
    ],
    stylingHeading: 'Styling art in the living room',
    stylingTips: [
      'Hang the centre of the piece at eye level, roughly 145 to 150 cm off the floor. Above a sofa, leave 15 to 25 cm between the frame and the sofa back.',
      'One large print makes a feature wall; a pair or trio (the Birdie prints sit well together) makes an easy gallery wall.',
      'Warm tones like Tree Top Peach soften a minimalist room, while a bold abstract lifts a calmer palette.',
    ],
    stylingCards: [
      {
        label: 'Height',
        tip: 'Hang the centre of the piece at eye level, roughly 145 to 150 cm off the floor. Above a sofa, leave 15 to 25 cm between the frame and the sofa back.',
        image: '/images/collections/living-room-height.jpg',
        alt: 'Framed Scandinavian wall art hung above a green sofa in a calm living room',
      },
      {
        label: 'Grouping',
        tip: 'One large print makes a feature wall; a pair or trio (the Birdie prints sit well together) makes an easy gallery wall.',
        image: '/images/collections/living-room-grouping.jpg',
        alt: 'A pair of framed Scandinavian prints side by side above a sideboard in a living room',
      },
      {
        label: 'Tone',
        tip: 'Warm tones like Tree Top Peach soften a minimalist room, while a bold abstract lifts a calmer palette.',
        image: '/images/collections/living-room-tone.jpg',
        alt: 'A single bold red art print on a neutral Scandinavian living room wall',
      },
    ],
    relatedArticleSlug: 'how-to-style-scandinavian-wall-art-living-room',
    relatedArticleLabel: 'How to style Scandinavian wall art in the living room',
    faqs: [
      {
        question: 'What wall art works best in a Scandinavian living room?',
        answer:
          'Aim for one piece with enough presence to hold the main wall, then keep the rest of the room quieter around it. A bold, colourful abstract lifts a pale, minimalist scheme, while a calm botanical landscape settles a room that is already busy with colour and pattern. The trick is to let one thing lead rather than hang several pieces that compete.',
      },
      {
        question: 'How big should a print be above the sofa?',
        answer:
          "Go large. A single piece works best when it fills a good part of the sofa’s width, or hang a pair or trio to cover the same span. Sizes vary by artwork and are shown on each product page, with the larger formats such as A1 or 50 x 70 cm suiting a sofa wall. Centre the piece at eye level, roughly 145 to 150 cm from the floor, and leave 15 to 25 cm between the frame and the sofa back.",
      },
      {
        question: 'Can I order a living room print framed, and how is it delivered?',
        answer:
          'Yes. Every print can be ordered unframed, or with a wood, black or white frame, chosen on the product page before you add it to the basket, where the price for the size you pick is shown. Prints are made to order on museum-quality archival paper and delivered worldwide, with the cost shown at checkout.',
      },
    ],
  },
  {
    slug: 'bedroom',
    chipLabel: 'Bedroom',
    axis: 'room',
    title: 'Scandinavian Bedroom Wall Art',
    description:
      'Calm Scandinavian and Nordic wall art for the bedroom: restful botanicals and soft abstracts from independent Norwegian artists. Framing options and worldwide delivery.',
    heading: 'Scandinavian Wall Art for the Bedroom',
    intro:
      'The bedroom asks for calm, and these prints lean into it. Restful botanicals, soft landscapes and quiet abstracts in gentle palettes, chosen to help the room wind down rather than compete with it. Every piece is made to order and finished to museum standard, with sizes to suit the wall above a bed or a quiet reading corner.',
    intro2:
      'Unlike the rooms you show off, the bedroom is chosen for an audience of one, so trust what genuinely settles you rather than what looks right in a photograph. The best Scandinavian bedroom wall art is the piece you are happy to wake up to and the last thing you see at night, which usually means soft over striking. Keep the palette close to the walls and the bedlinen, and let the room stay low and restful.',
    productSlugs: [
      'eltsjoen',
      'trysilkaffe',
      'tree-top-peach',
      'morgenlevering',
      'hyttefrokost',
      'hummer-og-vin',
      'ithinkithink',
      'swallow-dive',
      'vinkveld',
      'birdie-blue',
      'birdie-green',
    ],
    stylingHeading: 'Styling art in the bedroom',
    stylingTips: [
      'Centre a piece over the bed, about 15 to 20 cm above the headboard, and keep it within the width of the bed so it feels anchored.',
      'Softer, cooler tones settle a bedroom. Save the boldest pieces for the rooms you pass through, not the ones you rest in.',
      'A wide single print suits the space above a headboard; a matching pair works either side of the bed or above bedside tables.',
    ],
    stylingCards: [
      {
        label: 'Placement',
        tip: 'Centre a piece over the bed, about 15 to 20 cm above the headboard, and keep it within the width of the bed so it feels anchored.',
        image: '/images/collections/bedroom-placement.jpg',
        alt: 'A framed Scandinavian print on the wall beside a made bed',
      },
      {
        label: 'Palette',
        tip: 'Softer, cooler tones settle a bedroom. Save the boldest pieces for the rooms you pass through, not the ones you rest in.',
        image: '/images/collections/bedroom-palette.jpg',
        alt: 'A single framed art print in a calm, green-toned Scandinavian bedroom',
      },
      {
        label: 'Pairing',
        tip: 'A wide single print suits the space above a headboard; a matching pair works either side of the bed or above bedside tables.',
        image: '/images/collections/bedroom-pairing.jpg',
        alt: 'A pair of framed Scandinavian prints on the wall above a bed',
      },
    ],
    relatedArticleSlug: 'complete-guide-choosing-print-sizes',
    relatedArticleLabel: 'A complete guide to choosing print sizes',
    faqs: [
      {
        question: 'What art suits a bedroom?',
        answer:
          'Keep it soft. Gentle botanicals, hazy landscapes and quiet abstracts in muted or cool tones help a bedroom wind down, where a bold, high-contrast piece can keep the room feeling awake. Match the print’s palette to your walls and bedlinen so the wall reads as part of the room rather than an announcement.',
      },
      {
        question: 'Where should I hang art above the bed?',
        answer:
          'Centre the piece over the bed, about 15 to 20 cm above the headboard, and keep it within the width of the bed so it feels anchored. A single wide print suits the space above a headboard, while a matching pair works either side of the bed or above bedside tables. Sizes vary by artwork and are listed on each product page.',
      },
      {
        question: 'What if the print does not suit the room once it is up?',
        answer:
          'You have 14 days to change your mind, so there is room to live with a piece before you commit. It helps to order the frame that matches your others, unframed, or a wood, black or white frame, all chosen on the product page, where the price for the size you pick is shown. Prints are made to order and delivered worldwide, with the cost shown at checkout.',
      },
    ],
  },
  {
    slug: 'home-office',
    chipLabel: 'Home Office',
    axis: 'room',
    title: 'Scandinavian Home Office Wall Art',
    description:
      'Scandinavian and Nordic wall art for the home office: characterful illustrations and bold abstracts from independent Norwegian artists. Framing options and worldwide delivery.',
    heading: 'Scandinavian Wall Art for the Home Office',
    intro:
      'A good home office holds your interest without stealing your focus. These prints bring some personality to the desk wall: characterful, hand-drawn illustrations and bold abstracts with enough energy to carry a working day. All are produced to museum quality, in sizes from a single desk print to a full wall behind you on calls.',
    intro2:
      'The home office is often the one corner of the house you get to furnish entirely to your own taste, with no one else to please, so it is worth a piece with a bit of character. Good Scandinavian home office wall art earns its place by lifting the mood of the room without demanding attention, a wry illustration or a confident abstract that makes the desk feel less like a workstation. Pick colours that sit happily with your monitor and desk rather than fight them.',
    productSlugs: [
      'eye-nose-eye',
      'half-man',
      'mean-snothing',
      'morgenstrekk',
      'slingshot',
      'dragon',
      'dancer',
      'birdie-blue',
      'birdie-pink',
      'ithinkithink',
      'swallow-dive',
    ],
    stylingHeading: 'Styling art in the home office',
    stylingTips: [
      'Hang a piece in your eyeline from the desk, at or just above screen height, so it gives you something when you look up.',
      'A small grid of illustrations suits a narrow desk wall; one bold abstract holds a larger space behind you on calls.',
      'Graphic, characterful pieces keep a workspace from feeling flat. Save the calmest botanicals for the rooms you relax in.',
    ],
    stylingCards: [
      {
        label: 'Sightline',
        tip: 'Hang a piece in your eyeline from the desk, at or just above screen height, so it gives you something when you look up.',
        image: '/images/collections/office-sightline.jpg',
        alt: 'A framed Scandinavian print hung at eye level above a home office desk',
      },
      {
        label: 'Layout',
        tip: 'A small grid of illustrations suits a narrow desk wall; one bold abstract holds a larger space behind you on calls.',
        image: '/images/collections/office-layout.jpg',
        alt: 'A pair of framed Scandinavian art prints above a home office desk',
      },
      {
        label: 'Character',
        tip: 'Graphic, characterful pieces keep a workspace from feeling flat. Save the calmest botanicals for the rooms you relax in.',
        image: '/images/collections/office-character.jpg',
        alt: 'A bold graphic Scandinavian print above a home office desk',
      },
    ],
    relatedArticleSlug: 'the-art-of-choosing-art-comprehensive-guide',
    relatedArticleLabel: 'The art of choosing art: a comprehensive guide',
    faqs: [
      {
        question: 'What art works in a home office?',
        answer:
          'Something with personality that still lets you concentrate. Characterful illustrations and bold, graphic abstracts keep a workspace from feeling flat, while the calmest botanicals are better saved for the rooms you relax in. Aim for one piece with a glint to it rather than a busy wall that competes with your screen.',
      },
      {
        question: 'Where should I hang a print in a home office?',
        answer:
          'Put it in your eyeline from the desk, at or just above screen height, so it gives you something when you look up. A small grid of prints suits a narrow desk wall, while one larger piece holds the space behind you on calls. Sizes vary by artwork and are shown on each product page, from a single desk print up to a full-wall format.',
      },
      {
        question: 'Can I order an office print framed, and how quickly does it arrive?',
        answer:
          'Yes. Choose unframed, or a wood, black or white frame, on the product page before adding to the basket, where the price for the size you pick is shown. Every print is made to order on museum-quality archival paper, typically 1 to 4 business days in production plus delivery to your region, with the cost shown at checkout.',
      },
    ],
  },
  {
    slug: 'kitchen',
    chipLabel: 'Kitchen',
    axis: 'room',
    title:
      'Scandinavian Kitchen Wall Art',
    description:
      'Kitchen wall art with Scandinavian character: four food and table still lifes by Bergen illustrator Sia Siamos, plus ideas for hanging them. Framed or unframed.',
    heading:
      'Scandinavian Wall Art for the Kitchen',
    intro:
      'Four prints, and between them a whole lobster, two carafes, a cafetière and more tomatoes than one table needs. All four are by Sia Siamos, a Greek and Norwegian illustrator living in Bergen, who paints food the way you actually meet it: mid-meal, hands reaching in from the edges, the cork already out of the bottle. In a kitchen they do the thing a landscape can\'t, which is agree with the room. Each comes in one size, 50 x 70 cm, framed in wood, black or white, or unframed.',
    intro2:
      'Kitchens are harder on a print than any other room, and it\'s worth knowing that before you hang something you love in one. Steam, cooking splashes and a wall of afternoon sun all land here, so keep a piece off the working run between hob and sink and out of direct light if the room lets you. Everything else relaxes: a kitchen takes more colour than a living room does, because there\'s already colour in it, tiles and pans and fruit and the rest. These four are painted loud enough to hold their own against all that.',
    productSlugs: [
      'hummer-og-vin',
      'hyttefrokost',
      'morgenlevering',
      'vinkveld',
    ],
    stylingHeading: 'Kitchen wall art ideas',
    stylingTips: [
      'Hang it where you eat, not where you cook. The wall behind a kitchen table, a breakfast nook or the dining end of the room takes a print far better than the splashback run, and it\'s the wall you actually sit and look at.',
      'No spare wall? Go up and along. A single print above a doorway, on the end of a run of units, or propped on a shelf between the jars all work, and a 50 x 70 cm piece leaning on a plate rail looks deliberate rather than homeless.',
      'Hang two and let them face each other across the room: Vinkveld\'s dark evening tiles against Morgenlevering\'s morning light. That pair reads as a whole day, which is a better reason to buy two prints than symmetry is.',
      'Frame colour does more work in a kitchen than elsewhere. Black sharpens a scheme of white units and pale wood, a wood frame warms up a kitchen that has come out a little clinical, and white all but disappears into a painted wall.',
    ],
    relatedArticleSlug: 'norwegian-words-behind-the-prints',
    relatedArticleLabel: 'The Norwegian words behind the prints',
    faqs: [
      {
        question: 'What wall art works in a kitchen?',
        answer:
          'Food, if you want the easy answer. A table scene or a still life belongs in a kitchen in a way a portrait or a landscape never quite does, and it can carry more colour than you\'d hang in a quieter room. The four prints here are exactly that: a lobster dinner, a cabin breakfast, a morning table and a wine evening, all bold enough to compete with tiles and open shelving.',
      },
      {
        question: 'Where should I hang art in a small kitchen?',
        answer:
          'Look above the eye line and at the ends. The wall above a small table, the flat end of a run of units, the space over a doorway and the gap above a radiator are all usable, and a print propped on a shelf or plate rail needs no wall at all. The one place to avoid is the working stretch between hob and sink, where steam and splashes end up.',
      },
      {
        question: 'What size are the kitchen prints, and can I order them framed?',
        answer:
          'All four come in one size, 50 x 70 cm, which suits most kitchen walls without needing a measure-up. Choose unframed, or a wood, black or white frame, on the product page before adding to the basket, where the price for that size is shown. Prints are made to order and delivered worldwide with the cost shown at checkout, and you have 14 days from delivery to change your mind.',
      },
    ],
  },
];

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find(c => c.slug === slug);
}
