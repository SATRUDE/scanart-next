import fs from 'fs/promises';
import path from 'path';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured: boolean;
  featuredImage: string;
  featuredProducts: string[];
  selectedArtworkIds: string[];
  relatedArticleIds: string[];
  published: boolean;
  publishedDate: string;
  contentSection1: string;
  contentSection2: string;
  contentSection3: string;
  contentImages: string[];
  quoteText: string;
  quoteAuthor: string;
  ctaText: string;
  ctaLink: string;
}

export async function getAllArticles(): Promise<Article[]> {
  const filePath = path.join(process.cwd(), 'public', 'notion-data', 'articles.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const articles: Article[] = JSON.parse(data);
    return articles.filter(a => a.published);
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find(a => a.slug === slug) ?? null;
}
