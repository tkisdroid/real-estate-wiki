import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/real-estate-wiki",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
