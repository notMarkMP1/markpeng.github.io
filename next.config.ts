import type { NextConfig } from "next";
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  outputFileTracingExcludes: {
    '/': ['.next/cache', '.git'],
    '/blog/[slug]': ['.next/cache', '.git'],
    '/blog': ['.next/cache', '.git'],
  }
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
