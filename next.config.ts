import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'demo.edublink.co',
      },
    ],
  },
};

export default nextConfig;
