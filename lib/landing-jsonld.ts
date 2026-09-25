// Structured data for the listing and landing pages (docs/v2-seo.md, "Structured
// data"): FAQPage + CollectionPage/ItemList + BreadcrumbList on every category,
// collection, wall-art and nordic-art page, and CollectionPage/ItemList on
// /products. One builder for both languages, because the Norwegian pages had
// drifted: until the V2 build their ItemLists pointed every print at the English
// /product URL and their breadcrumbs at /products, so a /no page described the
// English site to search. The locale decides the URLs here, once.
import { BASE_URL } from '@/lib/site';

export type Locale = 'en' | 'no';

const prefix = (locale: Locale) => (locale === 'no' ? '/no' : '');

/** Absolute URL of a print in the page's own tree. */
export function productUrl(slug: string, locale: Locale): string {
  return `${BASE_URL}${prefix(locale)}/product/${slug}`;
}

/** Absolute URL of the catalogue in the page's own tree. */
export function productsUrl(locale: Locale): string {
  return `${BASE_URL}${prefix(locale)}/products`;
}

/** Absolute URL of the home page in the page's own tree (no trailing slash on /no). */
export function homeUrl(locale: Locale): string {
  return locale === 'no' ? `${BASE_URL}/no` : BASE_URL;
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[], inLanguage?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(inLanguage ? { inLanguage } : {}),
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
  locale,
  inLanguage,
  products,
}: {
  name: string;
  description: string;
  /** The page's own path, already including /no on Norwegian pages. */
  path: string;
  locale: Locale;
  inLanguage?: string;
  products: { slug: string; name: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${BASE_URL}${path}`,
    ...(inLanguage ? { inLanguage } : {}),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: productUrl(p.slug, locale),
        name: p.name,
      })),
    },
  };
}

/** Home, the catalogue, then the page itself: the trail every landing sits on. */
export function landingBreadcrumbJsonLd({
  locale,
  homeName,
  productsName,
  name,
  path,
}: {
  locale: Locale;
  homeName: string;
  productsName: string;
  name: string;
  /** The page's own path, already including /no on Norwegian pages. */
  path: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeName, item: homeUrl(locale) },
      { '@type': 'ListItem', position: 2, name: productsName, item: productsUrl(locale) },
      { '@type': 'ListItem', position: 3, name, item: `${BASE_URL}${path}` },
    ],
  };
}
