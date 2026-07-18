import type { Metadata } from 'next';

export const BASE_URL = 'https://www.scandinavianart.co.uk';

// The site-wide social sharing image, also the layout default (app/layout.tsx).
export const OG_IMAGE = '/images/scandinavian-art-gallery-og.jpg';

/**
 * Page-specific Open Graph + Twitter card metadata.
 *
 * Next merges metadata SHALLOWLY: when a page sets its own `openGraph` or
 * `twitter`, it REPLACES the layout's object entirely rather than deep-merging,
 * and a page that omits them INHERITS the layout's (whose copy is the
 * homepage's). So a listing page that wants its own social title/description
 * must also restate the image, or it drops the site OG image. This helper keeps
 * that correct and consistent across the static/listing pages.
 */
export function socialCard({
  title,
  description,
  path,
  image = OG_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  return {
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${path}`,
      siteName: 'Scandinavian Art Gallery',
      locale: 'en_GB',
      type: 'website',
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
