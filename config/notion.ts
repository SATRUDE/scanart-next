import { Client } from '@notionhq/client';

let _notion: Client | null = null;

export function getNotionClient() {
  if (!_notion) {
    const auth = process.env.NOTION_API_KEY;
    if (!auth) throw new Error('NOTION_API_KEY not configured');
    _notion = new Client({ auth });
  }
  return _notion;
}

export const NOTION_DATABASES = {
  ARTICLES: process.env.NOTION_ARTICLES_DATABASE_ID || '',
  COMPONENTS: process.env.NOTION_COMPONENTS_DATABASE_ID || '',
};

export const COMPONENT_TYPES = {
  HERO: 'Hero',
  TEXT_BLOCK: 'TextBlock',
  IMAGE: 'Image',
  GALLERY: 'Gallery',
  QUOTE: 'Quote',
  PRODUCT_SHOWCASE: 'ProductShowcase',
  CTA: 'CTA',
};
