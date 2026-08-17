// The one place that decides whether a page title can afford the brand suffix.
//
// The root layout sets `title.template = '%s | Scandinavian Art Gallery'`, so
// every page title that is not `absolute` grows by 27 characters before it
// reaches a search result. A result shows roughly 60 characters and cuts the
// rest, which means the suffix is not free: it is spent out of the same budget
// as the page's own words, and on this site it was routinely spending more than
// was left. The journal was the worst case, because an article headline is
// written to read as a headline rather than to leave room for a suffix.
//
// The brand is worth keeping when it fits. It is not worth keeping at the cost
// of the words that describe the page, and it is not load-bearing when it goes:
// the domain is scandinavianart.co.uk and the result carries the site name
// above the title anyway.

/**
 * How much of a title a search result will actually show.
 *
 * Google renders titles to a pixel width (around 600px) rather than a character
 * count, so this is a working approximation rather than a hard rule. It is
 * deliberately the conservative end of the usual 60-70 character range.
 */
export const META_TITLE_MAX_LENGTH = 60;

/** What `title.template` in app/layout.tsx appends to a non-absolute title. */
export const BRAND_SUFFIX = ' | Scandinavian Art Gallery';

/**
 * A page title that keeps the brand suffix only when there is room for it.
 *
 * Returns the bare string when the templated title fits inside the slot, which
 * lets the layout template append the suffix as usual. Returns `{ absolute }`
 * when it does not, which tells Next to skip the template and emit the page's
 * own title alone.
 *
 * A title that overflows the slot on its own is returned as `absolute` too. The
 * suffix cannot help there, and dropping it at least means the words that get
 * cut are the tail of the page's own sentence rather than the brand name
 * pushing them out. Shortening such a title is a copy decision, not this
 * function's job.
 *
 * @param title The page's own title, without the brand suffix.
 */
export function metaTitle(title: string): string | { absolute: string } {
  const trimmed = title.trim();
  return trimmed.length + BRAND_SUFFIX.length <= META_TITLE_MAX_LENGTH
    ? trimmed
    : { absolute: trimmed };
}
