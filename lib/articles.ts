import fs from 'fs/promises';
import path from 'path';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  featured: boolean;
  image: string;
  author: string;
  tags: string[];
  relatedArticles: string[];
  selectedArtworkIds: string[];
  published: boolean;
  created_time: string;
  last_edited_time: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
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

export async function getArticleBlocks(articleId: string): Promise<NotionBlock[]> {
  const filePath = path.join(process.cwd(), 'public', 'notion-data', `${articleId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
