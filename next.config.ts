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
    remotePatterns: [
      { protocol: 'https', hostname: '**.notion.so' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'www.scandinavianart.co.uk' },
    ],
  },
  async redirects() {
    return [
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
