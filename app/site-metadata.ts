import type { Metadata } from 'next';

import { BASE_URL } from '@/lib/site';

// Lifted verbatim out of the former single root layout when the tree was split
// into (en) and (no) route groups, so both roots keep serving exactly the tags
// the one root served before. Deliberately identical for both languages for
// now: the Norwegian pages already set their own title, description and
// alternates, and changing openGraph.locale for /no is a separate decision
// rather than a side effect of an accessibility fix.
export const siteMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Scandinavian Art Gallery | Framed Nordic Art Prints',
    template: '%s | Scandinavian Art Gallery',
  },
  description: 'Curated Scandinavian and Nordic art prints from independent artists. Shop framed or unframed wall art, delivered worldwide. Discover the collection.',
  keywords: ['Scandinavian art', 'Nordic art', 'Scandinavian wall art', 'Nordic prints', 'Scandinavian artists', 'art gallery', 'wall art', 'prints', 'artwork', 'Nordic design'],
  authors: [{ name: 'Scandinavian Art Gallery' }],
  robots: 'index, follow',
  // NOTE: the RSS autodiscovery link is NOT declared here. Metadata objects are
  // merged *shallowly* down the segment tree, so a page that sets `alternates`
  // at all (every page in this app sets `alternates.canonical`) replaces the
  // root's whole `alternates` object and drops a `types` entry declared here.
  // It lived here until 2026-08-20 and reached no page's <head> as a result, so
  // it is rendered as a raw <link> in the <head> below instead: that applies to
  // every route, including any added later, with no per-page opt-in to forget.
  verification: {
    google: 'Q044oiN2tnwr8F7eUthQjHaf0jXLsFmHuS1ZnN2aEV0',
  },
  other: {
    'p:domain_verify': 'f545c7d3764c8418167cc16b7612b605',
  },
  openGraph: {
    title: 'Scandinavian Art Gallery | Framed Nordic Art Prints',
    description: 'Curated Scandinavian and Nordic art prints from independent artists. Shop framed or unframed wall art, delivered worldwide.',
    url: BASE_URL,
    siteName: 'Scandinavian Art Gallery',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: '/images/scandinavian-art-gallery-og-wahlqvist.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scandinavian Art Gallery | Framed Nordic Art Prints',
    description: 'Curated Scandinavian and Nordic art prints from independent artists. Framed or unframed, delivered worldwide.',
    images: ['/images/scandinavian-art-gallery-og-wahlqvist.jpg'],
    site: '@scandinavianart',
  },
};

