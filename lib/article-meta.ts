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
