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
  /**
   * When the article actually went live, from the socialagent store's
   * `publishedAt`. Distinct from `created_time`, which is when the draft row
   * was made: since scheduled publishing landed on 2026-08-14 a piece can sit
   * in the drawer for a week or more before it goes out. Optional because the
   * committed fallback snapshot predates the field.
   */
  published_time?: string;
}

export interface NotionBlock {
  id: string;
  type: string;
  // Notion's per-type payloads, typed at the point of use: the renderer casts
  // block[type] to the shape it needs, so unknown loses nothing here.
  [key: string]: unknown;
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
