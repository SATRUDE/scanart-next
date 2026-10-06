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
// headline, which lives in the articles database. "Scandinavian art prints" and
// "Nordic art prints" belong to /scandinavian-wall-art (T-0156), so the best-of
// guide asks for "best Scandinavian prints" instead.
export const ARTICLE_META_TITLES: Record<string, string> = {
  'best-scandinavian-art-prints': 'Best Scandinavian Prints: Seven Picks by Independent Artists',
};
