import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  outputFileTracingExcludes: {
    '/': ['.next/cache', '.git', '.pnpm-store/**'],
    '/blog/[slug]': ['.next/cache', '.git', '.pnpm-store/**'],
    '/blog': ['.next/cache', '.git', '.pnpm-store/**'],
  },
};

export default nextConfig;
