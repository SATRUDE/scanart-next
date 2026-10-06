// Which journal articles each landing page links to, so Google reaches them
// from pages it already crawls instead of only through /journal (T-0144: eight
// articles were live at /article/<slug> but unindexed, with no inbound link
// beyond the journal grid).
//
// One place for the slug, the English label and the bokmål label, shared by the
// collection, category and wall-art pages in both trees. Articles are the one
// untranslated route, so the /no pages link out to the English article on
// purpose (the same pattern as a collection's relatedArticleSlug).
// Keep each list short: a few links that fit the page, not a link farm.

export interface JournalLink {
  slug: string;
  label: { en: string; no: string };
}

export const journalLinks = {
  'scandinavian-gallery-wall': {
    slug: 'scandinavian-gallery-wall',
    label: {
      en: 'The Scandinavian gallery wall: spacing, rules and restraint',
      no: 'Den skandinaviske galleriveggen: avstand, regler og tilbakeholdenhet',
    },
  },
  'how-to-choose-wall-art-for-a-scandinavian-interior': {
    slug: 'how-to-choose-wall-art-for-a-scandinavian-interior',
    label: {
      en: 'How to choose wall art for a Scandinavian interior',
      no: 'Slik velger du veggkunst til et skandinavisk interiør',
    },
  },
  'bedroom-wall-art-ideas': {
    slug: 'bedroom-wall-art-ideas',
    label: {
      en: 'Wall art for the bedroom: what to hang above a bed',
      no: 'Veggkunst til soverommet: hva du henger over sengen',
    },
  },
  'scandinavian-abstract-art': {
    slug: 'scandinavian-abstract-art',
    label: {
      en: 'Scandinavian abstract art: what abstraction looks like in the North',
      no: 'Skandinavisk abstrakt kunst: slik ser abstraksjon ut i Norden',
    },
  },
  'modern-scandinavian-art': {
    slug: 'modern-scandinavian-art',
    label: {
      en: 'Modern Scandinavian art: the movement, the painters and what it means now',
      no: 'Moderne skandinavisk kunst: bevegelsen, malerne og hva den betyr i dag',
    },
  },
  'best-nordic-art-prints': {
    slug: 'best-nordic-art-prints',
    label: {
      en: 'How to choose a Nordic art print for your room',
      no: 'Slik velger du et nordisk kunsttrykk til rommet ditt',
    },
  },
  'how-to-frame-an-art-print': {
    slug: 'how-to-frame-an-art-print',
    label: {
      en: 'How to frame an art print (and the size trap to avoid)',
      no: 'Slik rammer du inn et kunsttrykk (og størrelsesfella du bør unngå)',
    },
  },
  'art-print-or-poster': {
    slug: 'art-print-or-poster',
    label: {
      en: 'Art print or poster: what you are actually buying',
      no: 'Kunsttrykk eller plakat: hva du faktisk kjøper',
    },
  },
} satisfies Record<string, JournalLink>;

export type JournalLinkSlug = keyof typeof journalLinks;

/** Extra article links on a collection page, by collection slug. Sits beside the collection's own relatedArticleSlug. */
export const collectionJournalLinks: Record<string, JournalLinkSlug[]> = {
  'living-room': ['scandinavian-gallery-wall', 'how-to-choose-wall-art-for-a-scandinavian-interior'],
  'home-office': ['scandinavian-gallery-wall'],
  bedroom: ['bedroom-wall-art-ideas'],
};

/** Article links on a category page, by category slug. */
export const categoryJournalLinks: Record<string, JournalLinkSlug[]> = {
  abstract: ['scandinavian-abstract-art', 'modern-scandinavian-art'],
};

/** Article links on the /scandinavian-wall-art landing. */
export const wallArtJournalLinks: JournalLinkSlug[] = [
  'best-nordic-art-prints',
  'how-to-frame-an-art-print',
  'art-print-or-poster',
];

/** Resolve slugs to the { slug, label } pairs a page renders, in one language. */
export function journalLinksFor(slugs: JournalLinkSlug[] | undefined, locale: 'en' | 'no') {
  return (slugs ?? []).map(s => ({ slug: journalLinks[s].slug, label: journalLinks[s].label[locale] }));
}
