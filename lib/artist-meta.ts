// Titles and descriptions for the artist pages.
//
// Artist pages are the best-ranking template on the site and the worst at
// converting that rank into a visit. Over 1 to 28 August 2026 we ranked on page
// one for our artists' own names and took nothing from it: "sia siamos" 12
// impressions at position 5.2 with no clicks, "helene brox" 9 at 6.0 with no
// clicks, "ingunn dybendal" 5 at 7.4 with no clicks. Forty-four page-one
// impressions, zero clicks.
//
// The cause is what the result said. The title was the artist's name and
// nothing else ("Sia Siamos | Scandinavian Art Gallery") and the description
// was the opening sentence of the biography. Someone searching an artist's name
// already has that artist's own site, their Instagram and often an agency page
// above us, all of them saying the same thing about who the artist is. The one
// thing we have that none of them have is that the prints are for sale here,
// and neither field said so.
//
// So both fields now lead on the offer and keep the biography as the thing that
// makes one artist's result different from another's. Nothing here claims
// anything the site does not already claim: "framed or unframed" and "delivered
// worldwide" are the homepage's own words, and the Norwegian is lifted from the
// Norwegian homepage rather than translated afresh.

import { META_SNIPPET_MAX_LENGTH } from './meta-snippet';

export type ArtistMetaLocale = 'en' | 'no';

/**
 * What each language calls the offer.
 *
 * `lead` and `tail` wrap the biography fragment; `linking` joins the artist's
 * name to it. The Norwegian tail is the Norwegian homepage description's own
 * phrasing ("med eller uten ramme, levert til hele verden"), so the artist
 * pages sound like the rest of the site rather than like a translation.
 */
const COPY: Record<ArtistMetaLocale, { title: (name: string) => string; lead: string; tail: string }> = {
  en: {
    title: (name) => `${name} art prints`,
    lead: 'Art prints by',
    tail: 'Framed or unframed, delivered worldwide.',
  },
  no: {
    title: (name) => `Kunsttrykk av ${name}`,
    lead: 'Kunsttrykk av',
    tail: 'Med eller uten ramme, levert til hele verden.',
  },
};

/**
 * The page title, which the root template completes with the gallery name.
 *
 * "Sia Siamos art prints" renders as "Sia Siamos art prints | Scandinavian Art
 * Gallery". Only artists with published work get a page at all
 * (`generateStaticParams` filters on the product count), so promising prints is
 * always true.
 */
export function artistMetaTitle(name: string, locale: ArtistMetaLocale = 'en'): string {
  return COPY[locale].title(name.trim());
}

/**
 * The biography's opening sentence, with its "<name> is " stripped, so it can
 * be read as a clause rather than a sentence.
 *
 * Every biography on file opens by naming the artist, which is exactly the word
 * the description has already said. Dropping it buys about fifteen characters
 * and stops the name appearing twice in one line. A biography written some
 * other way keeps its opening sentence whole and simply reads as a clause.
 *
 * Only the first sentence, on the same convention as `metaSnippet`: copy here
 * is written so the opening sentence stands alone. Taking the whole biography
 * instead let the budget run into the second sentence and cut it mid-thought
 * ("...based in Oslo. In his work he aims to."), which is worse than not
 * including it at all.
 */
function toClause(bio: string, name: string): string {
  const trimmed = bio.trim();
  const opener = new RegExp(`^${escapeRegExp(name.trim())}\\s+(is|er)\\s+`, 'i');
  const withoutName = trimmed.replace(opener, '');
  return firstSentence(withoutName);
}

/**
 * The first sentence, split only where a terminator is followed by a capital.
 *
 * Requiring the capital keeps an initial or an abbreviation inside its own
 * sentence rather than ending it.
 */
function firstSentence(text: string): string {
  const [first] = text.split(/(?<=[.!?])\s+(?=[A-ZÆØÅ])/u);
  return (first ?? text).trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * As much of the clause as fits, cut at a clause or word boundary.
 *
 * A comma is preferred to a space because these biographies are built from
 * appositive clauses ("an illustrator living and working in Oslo, part of the
 * Heiaklubben collective, with a degree from Falmouth"), so cutting at a comma
 * leaves a complete thought where cutting at a space leaves a fragment. No
 * ellipsis: the caller closes the sentence with a full stop, and an ellipsis
 * followed by more sentences reads as a truncation bug.
 */
function fitClause(clause: string, budget: number): string {
  const stripped = clause.replace(/[.,;:\s]+$/, '');
  if (stripped.length <= budget) return stripped;

  const window = stripped.slice(0, budget + 1);
  const lastComma = window.lastIndexOf(',');
  // Only honour a comma that leaves a substantial clause; a cut at the first of
  // several commas would throw away most of what distinguishes this artist.
  if (lastComma >= budget * 0.5) return window.slice(0, lastComma);

  const lastSpace = window.lastIndexOf(' ');
  if (lastSpace > 0) return window.slice(0, lastSpace).replace(/[.,;:]+$/, '');
  return stripped.slice(0, budget);
}

/**
 * The meta description: the offer, then what makes this artist this artist,
 * then how the print arrives.
 *
 * "Art prints by Helene Brox, an illustrator, hand letterer and mural painter
 * based in Oslo. Framed or unframed, delivered worldwide."
 *
 * Capped at the same 155 characters as every other snippet on the site, so
 * Google never cuts one mid-word. The biography is the part that gives, because
 * it is the only part that varies; the offer and the delivery line are the
 * reason the result is worth clicking and are never dropped. The full biography
 * still reaches the page body and the `Person` JSON-LD.
 *
 * @param name The artist's name.
 * @param bio The full biography, in the same language as `locale`.
 * @param locale Which language's copy to use.
 * @param maxLength The longest description to emit.
 */
export function artistMetaDescription(
  name: string,
  bio: string | null | undefined,
  locale: ArtistMetaLocale = 'en',
  maxLength: number = META_SNIPPET_MAX_LENGTH,
): string {
  const { lead, tail } = COPY[locale];
  const cleanName = name.trim();
  const opening = `${lead} ${cleanName}`;

  const clause = toClause(bio ?? '', cleanName);
  if (!clause) return `${opening}. ${tail}`;

  // ", " before the clause and ". " after it, plus the tail.
  const budget = maxLength - opening.length - 2 - 1 - 1 - tail.length;
  if (budget < 20) return `${opening}. ${tail}`;

  const fitted = fitClause(clause, budget);
  if (!fitted) return `${opening}. ${tail}`;
  return `${opening}, ${fitted}. ${tail}`;
}
