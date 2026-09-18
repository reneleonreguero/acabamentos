import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/acabamentos",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;