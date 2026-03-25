import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit uses Node.js fs/Buffer APIs — must NOT be bundled by webpack
  serverExternalPackages: ["pdfkit"],
  images: {
    // Images are already optimized at upload (WebP, 1200×1200, quality 85).
    // Disable Vercel image optimization to avoid exceeding the free-tier
    // 5K transformations/month limit.
    unoptimized: true,
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
