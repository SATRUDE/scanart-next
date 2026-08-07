import type { Metadata } from 'next';

export const BASE_URL = 'https://www.scandinavianart.co.uk';

// The site-wide social sharing image, also the layout default (app/layout.tsx).
export const OG_IMAGE = '/images/scandinavian-art-gallery-og.jpg';

// Shared social-card identity, mirrored in app/layout.tsx. Kept here so pages
// that build their own openGraph/twitter (article, artist) restate the same
// og:site_name / og:locale / twitter:site the layout sets, rather than dropping
// them to Next's shallow metadata merge (see the socialCard note below).
export const SITE_NAME = 'Scandinavian Art Gallery';
export const OG_LOCALE = 'en_GB';
export const TWITTER_SITE = '@scandinavianart';

/**
 * Page-specific Open Graph + Twitter card metadata.
 *
 * Next merges metadata SHALLOWLY: when a page sets its own `openGraph` or
 * `twitter`, it REPLACES the layout's object entirely rather than deep-merging,
 * and a page that omits them INHERITS the layout's (whose copy is the
 * homepage's). So a listing page that wants its own social title/description
 * must also restate the image, site name, locale and twitter handle, or it
 * drops them. This helper keeps that correct and consistent across the
 * static/listing pages.
 */
export function socialCard({
  title,
  description,
  path,
  image = OG_IMAGE,
  ogLocale = OG_LOCALE,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Open Graph locale; the Norwegian pages pass 'nb_NO'. */
  ogLocale?: string;
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${path}`,
      siteName: SITE_NAME,
      locale: ogLocale,
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_SITE,
      title,
      description,
      images: [image],
    },
  };
}
