// The one-line artist statement on the V2 product page (Figma 131:499, the
// large serif line beside the artist's name). It is an addition to the full
// bio and the artist link, never a replacement for them (docs/v2-seo.md,
// "Product content").
//
// No new claims: each line is lifted from copy already verified and live,
// either the artist's own bio in data/artists.ts or the editorial in
// lib/artist-editorial.ts, and the Norwegian twins (lib/i18n/no.ts,
// artistStatements) from the matching Norwegian bio or editorial. An artist
// with no line here simply shows the section without the statement.

export const artistStatements: Record<string, string> = {
  // data/artists.ts bio: "In his work he aims to capture moments, often before
  // they happen, with as few lines as possible."
  'simen-wahlqvist': 'He tries to capture moments, often before they happen, with as few lines as possible.',
  // lib/artist-editorial.ts para1, the habit borrowed from naive art.
  'hedvig-wallin': 'Keep the drawing simple, let the perspective go wonky, and pack in detail for the second look.',
  // lib/artist-editorial.ts para1.
  'helene-brox': 'Figures and birds cut down to silhouette, painted with the confidence of a papercut.',
  // data/artists.ts bio: her motto.
  'ingunn-dybendal': 'More is more is more is more.',
  // data/artists.ts bio.
  'sia-siamos': 'Drawn to the quiet details that say the most.',
  // data/artists.ts bio, its last sentence.
  'mikko-saarainen': 'He keeps the detail going right out to the edges, so the drawings get read as much as looked at.',
};
