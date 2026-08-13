// The /scandinavian-wall-art landing is the shop's flagship query-matched page
// for the 'wall art' search cluster (GSC 90d to 2026-08-01: 33 wall queries,
// ~310 impressions, 0 clicks; head query "scandinavian wall art" 66 imp). One
// strong page over a thin route family: it shows the FULL catalogue, with the
// room-modified tail handled by the existing /collection/* pages. Shared with
// app/sitemap.ts, the footer and LandingCrossLinks so wiring never drifts.
// Body copy drafted by Ken (Studio board, 2026-08-03) and wired verbatim;
// retargeted at the BUYING queries by his 2026-08-13 pass: the informational
// wall-art cluster never clicked (1 impression in 28 days by August), while
// "buy scandinavian art prints" showed us at position 43 with the old copy
// answering a different question. Title and H1 now say what those searchers
// typed; delivery claims are out of the title because they rot.

export interface WallArtLanding {
  title: string;
  description: string;
  heading: string;
  intro: string;
  intro2: string;
  /** The framing offer, the heart of the buying queries, as its own section. */
  framedHeading: string;
  framedBody: string;
  stylingHeading: string;
  faqs: { question: string; answer: string }[];
}

// The styling paragraph itself lives in the page component as JSX, so its
// mentions of the living room / bedroom / home office collections can carry
// real internal links (the sibling landings' stylingBody is a plain string).

export const wallArtLanding: WallArtLanding = {
  title: 'Buy Scandinavian Art Prints | Framed Nordic Prints',
  description:
    'Buy Scandinavian art prints by five independent Norwegian artists. Twenty Nordic prints, each framed in wood, black or white, or unframed, made to order.',
  heading: 'Buy Scandinavian Art Prints',
  intro:
    "This page is the whole gallery: twenty Scandinavian art prints, every one by an artist living and working in Norway, and every one sold framed or unframed. Renate Thor screen-prints her tumbling Birdie flock in Trondheim. Helene Brox paints pared-back cream figures in Oslo. Ingunn Dybendal draws folk flowers and patterned lakeland in coloured pencil, Sia Siamos crowds tables with lobster, wine and cabin breakfasts, and Simen Wahlqvist fits an entire joke into a handful of lines. Five hands, three styles, and not a filler print among them.",
  intro2:
    "Buying Scandinavian art prints online usually means scrolling a marketplace of ten thousand posters that have never been within a thousand miles of a fjord. This is the opposite. A small gallery, five artists we work with directly, and every print made to order rather than pulled from a warehouse. Choose the piece first and the frame second, and if you can't choose between two, the four Birdie colourways and Wahlqvist's squares are built to hang as pairs.",
  framedHeading: 'Framed or unframed',
  framedBody:
    "Every print here comes with the choice of three frames, wood, black or white, sized to the print. Wood suits the warmer botanical pieces and rooms with timber already in them; black sharpens the graphic abstracts and illustrations; white almost disappears against a pale Scandinavian wall and lets the colour do the talking. Grouping prints? Keep the frame the same across the set and the wall reads as one decision. And if you have a framer you trust, every piece is sold unframed too.",
  stylingHeading: 'Scandinavian wall art, room by room',
  faqs: [
    {
      question: 'Where can I buy Scandinavian art prints?',
      answer:
        'Right here, from the gallery itself rather than a marketplace. We work directly with five independent artists in Oslo, Trondheim and Bergen, and each print is made to order when you buy it: pick the size and the frame on the product page and it goes to print for you.',
    },
    {
      question: 'Can I buy the prints framed?',
      answer:
        'Yes. Every product page offers a wood, black or white frame alongside the unframed print, sized to the piece, so a framed print arrives finished rather than as a project. Unframed suits anyone with a frame waiting at home or a framer they already trust.',
    },
    {
      question: 'What sizes do the prints come in?',
      answer:
        "Most prints are 50 x 70 cm. Simen Wahlqvist's square illustrations are 50 x 50 cm, and Renate Thor's Birdie series comes in A3, A2 and A1. Each product page lists the sizes for that piece; as a rule of thumb, the larger formats hold a sofa or bed wall alone, and the smaller ones sit happily on a picture shelf or in a group.",
    },
    {
      question: 'Scandinavian, Nordic or Scandi: is there a difference?',
      answer:
        "Not one that matters when you're choosing a print. Scandinavian strictly means Norway, Sweden and Denmark; Nordic adds Finland and Iceland; Scandi is what everyone says by the third mention. The artists here all live and work in Norway, so the prints qualify under whichever word you searched for.",
    },
  ],
};
