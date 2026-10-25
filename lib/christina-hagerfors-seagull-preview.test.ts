import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { getAllProducts, getShopProductBySlug } from '@/lib/products';
import { sceneFocus } from '@/lib/scene-focus';
import { shopScenes } from '@/lib/shop-scenes';
import { no } from '@/lib/i18n/no';
import manifest from '@/scripts/artists/christina-hagerfors.json';

// Seagull on Bin, Christina Hägerfors's fifth poster (24 Oct 2026). It arrives as a
// review preview: visible on preview deployments, never sold in production, so
// merging this branch does not put it live. Going live is a separate change, made
// once Mark approves the copy and says yes.
const SLUG = 'seagull-on-bin';
const work = manifest.prints.find(p => p.slug === SLUG)!;

afterEach(() => vi.unstubAllEnvs());

describe('Seagull on Bin is a preview, not live', () => {
  it('is held back in the catalogue file: unpublished, review, out of stock', () => {
    const raw = JSON.parse(readFileSync('public/notion-data/products.json', 'utf8'));
    const entry = raw.find((p: { slug: string }) => p.slug === SLUG);
    expect(entry).toMatchObject({ published: false, review: true, inStock: false, artistId: '12', productId: '64' });
  });

  it('is not sold, fed or listed in production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    expect((await getAllProducts()).some(p => p.slug === SLUG)).toBe(false);
    expect(await getShopProductBySlug(SLUG)).toBeNull();
  });

  it('shows on a preview deployment at 50 x 70 cm on the Entry list, like her other four', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const product = await getShopProductBySlug(SLUG);
    expect(product?.name).toBe(work.name);
    expect(product?.description).toBe(work.description);
    expect(product?.published).toBe(false);
    expect(Object.keys(product!.prices)).toEqual(['50x70cm']);
    expect(product!.prices['50x70cm']).toEqual({ GBP: 35, USD: 45, NOK: 500, DKK: 325, SEK: 500 });
  });

  it('has its product shot, warm shot, room scene and scene focus on disk', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    const product = (await getShopProductBySlug(SLUG))!;
    for (const src of [product.image, product.secondaryImage!, product.secondaryImage!.replace('.avif', '.webp'), `/images/products/warm/${SLUG}.webp`]) {
      expect(existsSync(`public${src}`), src).toBe(true);
    }
    expect(sceneFocus(product.secondaryImage!)).toBeDefined();
    expect(shopScenes[SLUG]?.image).toBe(product.secondaryImage);
  });

  it('has a Norwegian description to match the English one', () => {
    expect(no.productCopy[SLUG]?.description).toBe(work.descriptionNo);
  });
});
