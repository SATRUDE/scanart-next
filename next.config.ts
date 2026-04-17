import type { NextConfig } from "next";

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
    ];
  },
};

export default nextConfig;
