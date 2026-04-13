import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'olgidbvuvsbwxidoiurl.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/privasi',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/kebijakan',
        destination: '/privacy',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
