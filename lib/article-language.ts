/**
 * The journal's articles exist only in English (phase one), and the Norwegian
 * pages link to them as they are. Where a /no page shows an article card it
 * passes this, so the card says so quietly (a caption, "På engelsk") and marks
 * the link and the English title for assistive tech and search: hrefLang on
 * the link, lang on the title. English pages pass nothing and are unchanged.
 */
export interface ArticleLanguageNote {
  /** BCP 47 language of the article the card opens, e.g. 'en'. */
  lang: string;
  /** The visible label, in the page's language. */
  label: string;
}
