import type { NextConfig } from "next";

// Old product slugs carried a stray "2" suffix (Notion duplicate artefact),
// fixed at source on 2026-07-08. Keep redirecting the indexed URLs.
const LEGACY_PRODUCT_SLUGS: Record<string, string> = {
  'birdie-brown2': 'birdie-brown',
  'birdie-green2': 'birdie-green',
  'birdie-pink2': 'birdie-pink',
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
    ];
  },
};

export default nextConfig;
