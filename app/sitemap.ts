import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/products';
import { getAllArticles } from '@/lib/articles';

const BASE_URL = 'https://www.scandinavianart.co.uk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const articles = await getAllArticles();

  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE_URL}/products`, lastModified: new Date(), priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/journal`, lastModified: new Date(), priority: 0.8, changeFrequency: 'weekly' },
    ...products.map(p => ({
      url: `${BASE_URL}/product/${p.slug}`,
      lastModified: new Date(),
      priority: 0.7 as const,
      changeFrequency: 'monthly' as const,
    })),
    ...articles.map(a => ({
      url: `${BASE_URL}/article/${a.slug}`,
      lastModified: new Date(),
      priority: 0.6 as const,
      changeFrequency: 'monthly' as const,
    })),
  ];
}
