import fs from 'node:fs/promises';
import path from 'node:path';

/** A separate reader: review access must never widen the sellable catalogue. */
export function catalogueReviewEnabled(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === 'preview';
  return process.env.NODE_ENV === 'development' && process.env.CATALOGUE_PREVIEW === '1';
}

export interface ReviewProduct {
  slug: string;
  name: string;
  nameNo?: string;
  artist: string;
  artistId: string;
  description: string;
  category: string;
  image: string;
  imageAlt?: string;
  imageAltNo?: string;
  secondaryImage?: string;
  /** Original, unframed artwork, shown separately without cropping. */
  sourceImage?: string;
  /** Working titles, source-page context, and decisions still awaiting review. */
  reviewNotes?: string | string[];
  availableSizes?: string[] | null;
  proposedSizes?: string[];
  published: false;
  review: true;
}

export async function getCatalogueReview(): Promise<ReviewProduct[]> {
  if (!catalogueReviewEnabled()) return [];
  const file = path.join(process.cwd(), 'public', 'notion-data', 'products.json');
  const rows = JSON.parse(await fs.readFile(file, 'utf8')) as ReviewProduct[];
  // Unpublished also means retired. Only explicitly selected drafts belong here.
  return rows.filter(product => product.review === true && product.published === false);
}
