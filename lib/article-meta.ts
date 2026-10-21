// Search descriptions for journal articles whose Notion excerpt does not work
// as one. The excerpt is a teaser written for the journal cards; where it is
// too short for a search snippet, or does not describe the piece, the
// description is set here by slug and the excerpt is left alone.
export const ARTICLE_META_DESCRIPTIONS: Record<string, string> = {
  // Bing flagged the excerpt as too short, and it describes botanical
  // illustration rather than the interview.
  'an-interview-by-nordic-notes':
    'Nordic Notes talks to Scandinavian Art founder Mark Diffey about moving from the UK to Oslo and building a carefully considered collection of art prints.',
};

// Search titles for articles whose headline claims a head term a shop page owns.
// Only the <title> changes: the H1 and the journal cards keep the article's own
// headline, which lives in the articles database. T-0156 (6 Oct) gave the head
// terms to /scandinavian-wall-art and left "art prints" out of this title, but
// two weeks on Google still showed this guide for 'scandinavian art prints'
// (pos 8.9) and 'best scandinavian art prints' (10.4) with no clicks, while the
// owner page sat at 50+, so T-0174 (21 Oct) puts the searched phrase back. The count must match the
// picks in the article: it lost two when Helene Brox left (8 Oct), so the title
// said seven while the H1 said five until 19 Oct (T-0203).
export const ARTICLE_META_TITLES: Record<string, string> = {
  'best-scandinavian-art-prints': 'Best Scandinavian Art Prints: Five Picks by Nordic Artists',
};
