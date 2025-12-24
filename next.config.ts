import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  outputFileTracingExcludes: {
    '/': ['.next/cache', '.git', '.pnpm-store/**'],
    '/blog/[slug]': ['.next/cache', '.git', '.pnpm-store/**'],
    '/blog': ['.next/cache', '.git', '.pnpm-store/**'],
  }
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
