import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit uses Node.js fs/Buffer APIs — must NOT be bundled by webpack
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.evaanjewels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
