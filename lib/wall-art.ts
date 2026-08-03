// The /scandinavian-wall-art landing is the shop's flagship query-matched page
// for the 'wall art' search cluster (GSC 90d to 2026-08-01: 33 wall queries,
// ~310 impressions, 0 clicks; head query "scandinavian wall art" 66 imp). One
// strong page over a thin route family: it shows the FULL catalogue, with the
// room-modified tail handled by the existing /collection/* pages. Shared with
// app/sitemap.ts, the footer and LandingCrossLinks so wiring never drifts.
// Body copy drafted by Ken (Studio board, 2026-08-03) and wired verbatim;
// title/description are Peggy's search snippets drawn from the query data.

export interface WallArtLanding {
  title: string;
  description: string;
  heading: string;
  intro: string;
  intro2: string;
  stylingHeading: string;
  faqs: { question: string; answer: string }[];
}

// The styling paragraph itself lives in the page component as JSX, so its
// mentions of the living room / bedroom / home office collections can carry
// real internal links (the sibling landings' stylingBody is a plain string).

export const wallArtLanding: WallArtLanding = {
  title: 'Scandinavian Wall Art | Framed Nordic Prints, UK Delivery',
  description:
    'Scandinavian wall art by independent Norwegian artists. Framed and unframed Nordic prints for the living room, bedroom and home office, delivered across the UK and worldwide.',
  heading: 'Scandinavian Wall Art',
  intro:
    "Wall art, in a Scandinavian home, does the work the furniture politely declines: it brings the colour, the character and the occasional joke to rooms that keep everything else calm. This page holds the whole gallery, twenty prints by five independent Norwegian artists working across three registers. There are bold Nordic abstracts, from Renate Thor's rhythmic Birdie flock to Helene Brox's pared-back cream figures; botanical prints that run from Ingunn Dybendal's jewel-bright patterned landscapes to Sia Siamos's cabin breakfasts and kitchen tables; and Simen Wahlqvist's dry, few-lined illustrations. Different hands, one sensibility: clean form, confident colour, nothing wasted.",
  intro2:
    'There is no single Scandinavian look to buy into, but there is a shared temperament, and it makes choosing easier than a wall of twenty prints might suggest. Start with what the room needs: a bold abstract lifts a pale, minimal space, a soft botanical settles a busy one, and an illustration adds the glint of wit a too-tasteful room is quietly missing. Everything here comes from the five independent Norwegian artists behind the gallery, and every print is produced to the same museum standard, so the choice is about character, never quality.',
  stylingHeading: 'Styling Scandinavian wall art, room by room',
  faqs: [
    {
      question: 'How do I choose wall art for a Scandinavian-style interior?',
      answer:
        "Work with the restraint rather than against it. Pale walls and light wood are a ready-made gallery, so one confident piece usually beats several competing ones. Choose by the room's job: calm botanicals where you rest, bold abstracts where the scheme needs a lift, characterful illustrations where a little wit helps. Then pick a print whose ground colour echoes something already in the room, a rug, a cushion, a run of book spines, and it will look like it was always there.",
    },
    {
      question: 'What makes wall art Scandinavian?',
      answer:
        'Restraint, mostly, and an eye kept on nature. Clean forms, flat confident colour and subjects that trace back to the Nordic outdoors and the life lived around it: birds, mountains, kitchen tables, the first stretch of the morning. It is a sensibility rather than a strict style. The prints in this gallery are all by artists living and working in Norway, so here the word describes where the work comes from as well as how it looks.',
    },
    {
      question: 'Can I buy Scandinavian wall art framed, and what sizes are there?',
      answer:
        "Yes. Every print can be ordered unframed or with a wood, black or white frame, chosen on the product page. Sizes vary by artwork: most prints are 50 x 70 cm, Simen Wahlqvist's square illustrations are 50 x 50 cm, and Renate Thor's Birdie series comes in A3, A2 and A1. Everything is made to order and delivered worldwide, the UK included, with delivery costs shown at checkout.",
    },
    {
      question: 'How do I put together a Nordic gallery wall?',
      answer:
        "Slowly, and around one print you are sure of. Something has to connect the pieces: the four Birdie colourways share a composition, so any pair or trio reads as a set, and Simen Wahlqvist's squares line up naturally along a hallway or a picture shelf. A botanical beside an abstract works when the two share a colour. Keep the frames consistent, all wood, all black or all white, keep the gaps even, and let the wall grow a piece at a time.",
    },
  ],
};
