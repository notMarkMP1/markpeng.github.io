import path from 'path';
import type { MetadataRoute } from 'next';
import { getMDXData } from '@/app/utils/mdxUtils';

const BASE_URL = 'https://markpeng.me';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = getMDXData(path.join('app', 'blog', 'posts'))
    .filter((post) => !post.metadata.unlisted)
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.metadata.slug}`,
      lastModified: post.metadata.lastModifiedAt || post.metadata.publishedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

  return [...staticRoutes, ...blogRoutes];
}
