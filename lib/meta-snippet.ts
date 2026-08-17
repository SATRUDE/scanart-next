// The one place that turns body copy into a search/social snippet.
//
// A meta description is a fixed-width slot, not a place to put prose: Google
// renders roughly 155 characters and cuts the rest mid-word. Product pages
// already worked to that shape by taking the first sentence of the catalogue
// description, on the convention that each one is written to stand alone; the
// artist pages did not, and passed the whole bio through instead, which put a
// 712-character snippet on the best-ranking template on the site.
//
// The full copy is not lost by trimming here. It stays where it belongs: in
// the page body and in the JSON-LD (`Person.description` on an artist page,
// `Product.description` on a product page), which is what structured-data
// consumers read.

/** How much of a description a search result will actually show. */
export const META_SNIPPET_MAX_LENGTH = 155;

/**
 * A description trimmed to its first sentence, which is the shape a search
 * snippet wants.
 *
 * Copy on this site is written so the opening sentence stands alone, so the
 * first sentence is the snippet in every current case. The length cap is a
 * safety net for copy that is not written that way: a first sentence longer
 * than `maxLength` is cut at the last word boundary that fits and closed with
 * an ellipsis, so the field is never emitted at an arbitrary length.
 *
 * @param text The full description or bio.
 * @param maxLength The longest snippet to emit, ellipsis included.
 */
export function metaSnippet(text: string, maxLength: number = META_SNIPPET_MAX_LENGTH): string {
  const normalised = text.replace(/\s+/g, ' ').trim();
  if (!normalised) return '';

  // Sentence end is "full stop followed by a space", the same test the product
  // page used. It deliberately does not try to be a general sentence splitter:
  // an abbreviation mid-sentence would fool one, and the copy it runs over is
  // ours, so the simple rule is the honest one.
  const firstSentence = normalised.includes('. ')
    ? `${normalised.split('. ')[0]}.`
    : normalised;

  if (firstSentence.length <= maxLength) return firstSentence;

  // Too long even at one sentence: fall back to the plain clip.
  return clipToLength(firstSentence, maxLength);
}

/**
 * Copy cut to fit the snippet slot, at a word boundary, without any sentence
 * logic.
 *
 * This is the right rule for copy that was not written to open with a
 * stand-alone sentence. Journal excerpts are the case: they are teasers, so
 * their first sentence is often a hook rather than a summary, and taking it
 * alone gives a description that is accurate but far too short to earn its
 * place in a result. Two of the twenty-six would have come out at 56 and 62
 * characters, spending a third of the slot. Clipping keeps the whole teaser up
 * to the cap instead, and only the tail is lost.
 *
 * Copy already inside the cap is returned untouched, so this never lengthens or
 * shortens a description that was the right size to begin with.
 *
 * @param text The full excerpt or description.
 * @param maxLength The longest snippet to emit, ellipsis included.
 */
export function clipToLength(text: string, maxLength: number = META_SNIPPET_MAX_LENGTH): string {
  const normalised = text.replace(/\s+/g, ' ').trim();
  if (normalised.length <= maxLength) return normalised;

  // Cut to the last whole word that fits alongside the ellipsis, rather than
  // through the middle of one.
  const room = maxLength - 1;
  const clipped = normalised.slice(0, room);
  const lastSpace = clipped.lastIndexOf(' ');
  const body = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;
  return `${body.replace(/[.,;:!?]+$/, '')}…`;
}
