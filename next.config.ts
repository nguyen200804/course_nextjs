import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'demo.edublink.co',
      },
      {
        protocol: 'https',
        hostname: 'test4.questx.com.vn',
      },
      {
        protocol: 'http',
        hostname: 'test4.questx.com.vn',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
