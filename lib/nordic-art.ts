// The /nordic-art landing. Same shape as wall-art.ts because the page is the
// same kind of door: one query family, one page that answers it. The family
// here is "nordic art" / "nordic artwork" (Search Console: 307 + 134
// impressions in 90 days at positions 21-32 with no page owning the word:
// every landing on the site says "Scandinavian"). Copy by Ken, 24 Aug 2026;
// framing, size and delivery claims trace to wall-art.ts, collections.ts and
// products.json rather than being restated from memory.
import type { WallArtLanding } from '@/lib/wall-art';

export const nordicArtLanding: WallArtLanding = {
  title: 'Nordic Art: Prints by Four Norwegian Artists',
  description:
    'Nordic art by four artists working in Norway: folk pattern, table still lifes, pared-back figures and dry line drawings, from tradition to now.',
  heading: 'Nordic Art, from Folk Tradition to Now',
  intro:
    "Nordic art has always run on two currents at once: the folk tradition of pattern and ornament, and a newer instinct to pare everything back until shape does the work. Both are alive in this gallery. Ingunn Dybendal draws folk flowers and a patterned lakeland petal by petal in coloured pencil. Helene Brox cuts figures and birds down to flat, confident silhouette. Sia Siamos paints the Nordic table mid-meal, and Simen Wahlqvist tells whole jokes in a handful of lines. Four artists, all living and working in Norway.",
  intro2:
    "What makes artwork Nordic isn't the subject; there's no rule that says lakes and birches. It's a habit the region's artists share: take something ordinary, a mug of flowers, a breakfast table, a morning stretch, and give it real weight. The sixteen pieces here sit on a line between the two ends of that tradition. Some lean towards folk pattern, every bloom a separate invention worked in coloured pencil; others are as contemporary as a confession painted across a cobalt head. One honest note: Nordic covers five countries, and ours is currently a Norwegian catalogue. We'd rather be a small gallery that knows its sixteen pieces than a big one that's merely browsed them.",
  framedHeading: 'Made to order, framed or unframed',
  framedBody:
    "Each piece comes as a print, made to order when you buy it. Most are 50 x 70 cm; Simen Wahlqvist's square illustrations are 50 x 50 cm, and every product page lists the size for that piece. You can buy unframed, or framed in wood, black or white, sized to the print. Delivery is worldwide, with the cost shown at checkout.",
  stylingHeading: 'Hanging Nordic art at home',
  faqs: [
    {
      question: 'What is Nordic art?',
      answer:
        "Art from the five Nordic countries: Denmark, Norway, Sweden, Finland and Iceland. In practice the label covers everything from the old folk traditions of pattern and ornament to today's illustration and still life, held together by strong shape and an unembarrassed love of the domestic. Our own catalogue is honestly narrower than the label: all four artists we work with live and work in Norway, so what you'll find here is the Norwegian corner of the Nordic map.",
    },
    {
      question: 'What sizes do the prints come in, and can I have them framed?',
      answer:
        "Two formats cover the catalogue: 50 x 70 cm for most pieces, and 50 x 50 cm for Simen Wahlqvist's square illustrations, with the size listed on each product page. Every print can be bought unframed or framed in wood, black or white, sized to the print. Everything is made to order rather than held in stock, and delivered worldwide with the delivery cost shown at checkout.",
    },
    {
      question: 'How does Nordic art differ from Scandinavian style?',
      answer:
        "Scandinavian style is mostly a word for the interiors: pale wood, white walls, careful restraint. Nordic art is what those rooms were built to hold, and it's noticeably less restrained than they are. The folk tradition it grew from is cheerfully maximal, pattern on pattern, and even the sparest contemporary work keeps a wit the furniture doesn't. Geographically the words differ too, Nordic taking in Finland and Iceland as well, but on the wall the useful difference is register: the room whispers so the art doesn't have to.",
    },
  ],
};
