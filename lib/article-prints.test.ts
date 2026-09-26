import { describe, expect, it } from 'vitest';

import { resolvePrintFeatures, type PrintFeatureData } from '@/lib/article-prints';
import { markdownToBlocks } from '@/lib/markdown-blocks';

// Reads the committed catalogue snapshot (public/notion-data/products.json).
describe('resolvePrintFeatures', () => {
  it('fills a published print from the catalogue: name, artist, warm image, prices', async () => {
    const [block] = await resolvePrintFeatures(markdownToBlocks('::print[hummer-og-vin]'));
    const product = (block.print_feature as { product: PrintFeatureData }).product;
    expect(product.slug).toBe('hummer-og-vin');
    expect(product.name).toBe('Hummer og Vin');
    expect(product.artist).toBe('Sia Siamos');
    expect(product.image).toMatch(/\/warm\//);
    expect(product.sizeLabel).toBe('50 × 70 cm');
    expect(product.aspect).toBe('aspect-[5/7]');
    expect(Object.values(product.prices)[0].GBP).toBeGreaterThan(0);
  });

  it('drops an unknown slug and an unpublished one, keeping the text around them', async () => {
    const blocks = await resolvePrintFeatures(
      markdownToBlocks('One.\n::print[no-such-print]\n::print[surfer-with-orange-sun]\nTwo.')
    );
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
  });

  it('returns the same blocks untouched when there is no print feature', async () => {
    const blocks = markdownToBlocks('Just text.');
    expect(await resolvePrintFeatures(blocks)).toBe(blocks);
  });
});
