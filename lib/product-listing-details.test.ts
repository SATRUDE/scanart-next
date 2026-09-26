import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/product-feed.xml/route';
import { getAllProducts } from '@/lib/products';
import { getLowestProductPrices } from '@/lib/pricing';
import { productListingDetails } from '@/lib/product-listing-details';

const trial = ['sunday-brunch', 'rosa-blomster', 'massa-applen', 'small-house-big-ocean', 'mean-snothing'];

describe('Merchant Center listing trial', () => {
  it('uses only a real single-size offer and provides matching page facts in both languages', async () => {
    const products = await getAllProducts();
    expect(products.filter(p => productListingDetails(p)).map(p => p.slug).sort()).toEqual([...trial].sort());
    for (const slug of trial) {
      const product = products.find(p => p.slug === slug)!;
      const detail = productListingDetails(product)!;
      expect(detail.title.length).toBeLessThanOrEqual(150);
      expect(detail.title).toContain(product.name);
      expect(detail.title).toContain(product.artist);
      expect(detail.title).toContain('Unframed');
      expect(detail.size.replaceAll(' ', '')).toBe(Object.keys(product.sizes!)[0]);
      expect(detail.material).toBe('Paper');
      expect(detail.summary).toContain(detail.size.replace(' x ', ' × '));
      expect(productListingDetails(product, 'no')!.summary).toContain('uten ramme');
      expect(productListingDetails({ ...product, sizes: { A3: true, A2: true } })).toBeUndefined();
      expect(productListingDetails({ ...product, sizes: {} })).toBeUndefined();
    }
  });

  it('retains all catalogue IDs, GBP prices and artwork-first images while enriching five offers', async () => {
    const products = await getAllProducts();
    const xml = await (await GET()).text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g)!;
    expect(items).toHaveLength(products.length);
    // 24 published prints: Mikko Saarainen's four joined (2026-09-26).
    // Ishtar Bäcklund Dakhil's seven prints are held back until she has approved her
    // prices and content (restore from branch ishtar/preview, where this is 30). Update
    // it when the catalogue changes.
    expect(items).toHaveLength(24);
    expect(xml.match(/<g:product_type>/g)).toHaveLength(5);
    for (const product of products) {
      const item = items.find(item => item.includes(`<g:id>${product.slug}</g:id>`))!;
      expect(item).toContain(`<g:price>${getLowestProductPrices(product).GBP.toFixed(2)} GBP</g:price>`);
      expect(item).toContain(`${product.image}</g:image_link>`);
      expect(item.match(/<g:additional_image_link>/g)).toHaveLength(1);
      if (trial.includes(product.slug)) {
        expect(item).toContain('<g:structured_title>');
        expect(item).toContain('<g:digital_source_type>trained_algorithmic_media</g:digital_source_type>');
        expect(item).toContain('<g:material>Paper</g:material>');
      }
    }
  });

  it('keeps AI source metadata in all fifteen refreshed Merchant Center room images', async () => {
    const products = (await getAllProducts()).filter(p => p.secondaryImage?.includes('-2026-09-23.'));
    expect(products).toHaveLength(15);
    for (const product of products) {
      const path = join(process.cwd(), 'public', product.secondaryImage!.replace(/\.avif$/, '.webp'));
      const bytes = readFileSync(path);
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
      expect(bytes.includes(Buffer.from('http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'))).toBe(true);
    }
  });
});
