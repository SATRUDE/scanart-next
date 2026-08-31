import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/contexts/CartContext';
import { priceCategories, offeredPriceCategories, type PriceCategory } from '@/config/priceCategories';

interface NotionProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  artist: string;
  artistId: string;
  brand: string;
  inStock: boolean;
  featured: boolean;
  published: boolean;
  image: string;
  secondaryImage: string;
  availableSizes: string[];
  priceCategory: string;
  productId: string;
  recommendedProducts: string[];
}

function convertNotionProductToProduct(
  np: NotionProduct,
  categories: { [category: string]: PriceCategory } = priceCategories
): Product {
  const prices: { [key: string]: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number } } = {};
  const categoryPrices = categories[np.priceCategory];
  if (categoryPrices) {
    np.availableSizes.forEach(size => {
      if (categoryPrices[size]) prices[size] = categoryPrices[size] as { GBP: number; NOK: number; USD: number; DKK: number; SEK: number };
    });
  }

  const sizes: Record<string, boolean> = {};
  np.availableSizes.forEach(size => { sizes[size] = true; });

  return {
    id: np.productId || np.id,
    name: np.name,
    slug: np.slug,
    prices,
    image: np.image,
    secondaryImage: np.secondaryImage,
    description: np.description,
    category: np.category,
    brand: np.brand,
    artist: np.artist,
    artistId: np.artistId,
    inStock: np.inStock,
    published: np.published,
    featured: np.featured,
    sizes,
    recommendedProducts: np.recommendedProducts,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const filePath = path.join(process.cwd(), 'public', 'notion-data', 'products.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const notionProducts: NotionProduct[] = JSON.parse(data);
    const published = notionProducts.filter(p => p.published);
    // Retirements are applied here rather than in config/priceCategories.ts
    // because this is the only place that knows which lists the catalogue is
    // actually using, and a list still in use must not be taken away.
    const { offered, refused } = offeredPriceCategories(published.map(p => p.priceCategory));
    if (refused.length > 0) {
      console.warn(
        `Price ${refused.length === 1 ? 'list' : 'lists'} ${refused.join(', ')} retired in socialagent, ` +
          `but still priced here: ${published
            .filter(p => refused.includes(p.priceCategory))
            .map(p => p.slug)
            .join(', ')} would have no price at all. Move ${refused.length === 1 ? 'those prints' : 'them'} ` +
          `onto a live list before retiring it.`
      );
    }
    return published.map(p => convertNotionProductToProduct(p, offered));
  } catch (error) {
    // An unreadable catalogue is UNKNOWN, not empty, and the two used to be
    // indistinguishable downstream: every product surface renders empty and a
    // site search reports zero results for a query the catalogue would have
    // matched. Saying so out loud is the same principle as the retired-price
    // warning above, which this file already follows for the data it parses but
    // did not follow for the read itself.
    console.error(
      `Could not read the catalogue at ${filePath}. Treating it as empty for this render, ` +
        `so product surfaces will be blank rather than wrong:`,
      error
    );
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find(p => p.slug === slug) ?? null;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getAllProducts();
  if (category === 'All') return products;
  return products.filter(p => p.category === category);
}

export async function getProductsByArtist(artistId: string): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => p.artistId === artistId);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => p.featured);
}

export async function getRecommendedProducts(productNames: string[]): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => productNames.includes(p.name));
}

export async function getProductLastEditedMap(): Promise<Record<string, string>> {
  const filePath = path.join(process.cwd(), 'public', 'notion-data', 'products.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const raw: (NotionProduct & { last_edited_time?: string })[] = JSON.parse(data);
    return Object.fromEntries(
      raw.filter(p => p.last_edited_time).map(p => [p.slug, p.last_edited_time as string])
    );
  } catch {
    return {};
  }
}
