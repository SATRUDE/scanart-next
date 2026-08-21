import { enPathFor, isNoPath, noPathFor } from '@/lib/i18n';

/**
 * What the language half of the header control can actually do on a given page.
 *
 * The site has exactly TWO languages, English and Norwegian, and language is
 * carried by the URL (`/no/...`) rather than by a setting. So "switch language"
 * means "go to the twin of this page", and the honest answer on a page with no
 * twin is that it cannot be done here rather than a control that silently does
 * nothing.
 *
 * Products and articles have no Norwegian twin today: 16 products and 18
 * articles, none of them translated, which is 34 of the site's 74 URLs and
 * includes every page where someone buys something. That is why this returns a
 * reason rather than a boolean.
 */
export type LocaleCode = 'en' | 'no';

export interface LocaleOption {
  code: LocaleCode;
  /** What the visitor sees, in its own language. */
  label: string;
  /** Where choosing it goes, or null when this page has no twin. */
  href: string | null;
  current: boolean;
}

export const LOCALE_LABEL: Record<LocaleCode, string> = {
  en: 'English',
  no: 'Norsk',
};

export function localeOptions(pathname: string): LocaleOption[] {
  const onNo = isNoPath(pathname);
  const twin = onNo ? enPathFor(pathname) : noPathFor(pathname);
  return [
    {
      code: 'en',
      label: LOCALE_LABEL.en,
      href: onNo ? twin : null,
      current: !onNo,
    },
    {
      code: 'no',
      label: LOCALE_LABEL.no,
      href: onNo ? null : twin,
      current: onNo,
    },
  ];
}

/** The language the current URL is in. */
export function currentLocale(pathname: string): LocaleCode {
  return isNoPath(pathname) ? 'no' : 'en';
}

/**
 * True when this page simply has no version in the other language, as opposed
 * to the visitor already being on it. Drives the one-line explanation, because
 * an option that is greyed out with no reason reads as a bug.
 */
export function twinMissing(pathname: string): boolean {
  return !isNoPath(pathname) && noPathFor(pathname) === null;
}
