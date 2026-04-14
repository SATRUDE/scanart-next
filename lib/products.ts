import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/contexts/CartContext';
import { priceCategories } from '@/config/priceCategories';

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

function convertNotionProductToProduct(np: NotionProduct): Product {
  const prices: { [key: string]: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number } } = {};
  const categoryPrices = priceCategories[np.priceCategory];
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
    return notionProducts
      .filter(p => p.published)
      .map(convertNotionProductToProduct);
  } catch {
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

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => p.featured);
}

export async function getRecommendedProducts(productNames: string[]): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter(p => productNames.includes(p.name));
}
