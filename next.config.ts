import type { NextConfig } from "next";

// Old product slugs carried a stray "2" suffix (Notion duplicate artefact),
// fixed at source on 2026-07-08. Keep redirecting the indexed URLs.
const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  'dancer2': 'dancer',
  'dragon2': 'dragon',
  'eltsjoen2': 'eltsjoen',
  'eye-nose-eye2': 'eye-nose-eye',
  'half-man2': 'half-man',
  'hummer-og-vi2': 'hummer-og-vin',
  'hyttefrokost2': 'hyttefrokost',
  'ithinkithink2': 'ithinkithink',
  'mean-snothing2': 'mean-snothing',
  'morgenlevering2': 'morgenlevering',
  'morgenstrekk2': 'morgenstrekk',
  'Slingshot2': 'slingshot',
  'slingshot2': 'slingshot',
  'swallow-dive2': 'swallow-dive',
  'tree-top-peach2': 'tree-top-peach',
  'trysilkaffe2': 'trysilkaffe',
  'vinkveld2': 'vinkveld',
};

// Renate Thor's work left the catalogue on 2026-08-21 (Mark's call). Her four
// Birdie prints and her artist pages were indexed and earning: /product/birdie-brown
// was the third most-viewed page on the site and /artist/renate-thor ranked at
// position 7. Send that equity to the nearest live intent rather than a 404.
// The three "2"-suffixed Birdie slugs are here too, repointed straight at the
// destination instead of chaining through a slug that no longer resolves.
const RETIRED_PRODUCT_SLUGS = [
  'birdie-blue',
  'birdie-brown',
  'birdie-green',
  'birdie-pink',
  'birdie-brown2',
  'birdie-green2',
  'birdie-pink2',
];

const nextConfig: NextConfig = {
  images: {
    // Serve AVIF (then WebP) from the optimizer; both far smaller than the source.
    formats: ['image/avif', 'image/webp'],
    // Local files are content-stable, so cache optimized variants for a month
    // to avoid re-optimizing on every request.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: 'https', hostname: '**.notion.so' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'www.scandinavianart.co.uk' },
      // Remote-hosted article featured images (some journal articles hotlink
      // their hero). next/image only optimises allow-listed hosts, so without
      // these the optimizer 400s and the image breaks. Rehosting these locally
      // is the tracked follow-up (external hotlinks are a single point of failure).
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'www.munch.no' },
      // The socialagent Blob store: article heroes picked from the generated
      // mockup gallery are rehosted there as permanent public URLs.
      { protocol: 'https', hostname: 'm9gwpvkjxnjiqpwb.public.blob.vercel-storage.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/shop/:slug',
        destination: '/product/:slug',
        permanent: true,
      },
      ...Object.entries(LEGACY_PRODUCT_SLUGS).map(([oldSlug, newSlug]) => ({
        source: `/product/${oldSlug}`,
        destination: `/product/${newSlug}`,
        permanent: true,
      })),
      ...RETIRED_PRODUCT_SLUGS.map(slug => ({
        source: `/product/${slug}`,
        destination: '/category/abstract',
        permanent: true,
      })),
      {
        source: '/artist/renate-thor',
        destination: '/artists',
        permanent: true,
      },
      {
        source: '/no/artist/renate-thor',
        destination: '/no/artists',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
