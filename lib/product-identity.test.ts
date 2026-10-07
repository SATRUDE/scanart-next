import { describe, expect, it } from 'vitest';
import products from '../public/notion-data/products.json';
import { getAllProducts } from '@/lib/products';
import { computeOrderAmount } from '@/lib/server/order';
import type { DeliveryQuote } from '@/lib/server/shipping-rates';

// On 2026-10-07 product ids 43, 44 and 45 were each found on TWO prints: a
// Markus Naarttijärvi photograph and a Patrik Wennerlund one, added on
// parallel branches that each took "the next id" from the same base. The
// checkout looked prints up by id, so a Markus print was priced and recorded
// as Patrik's. Patrik's took 57, 58 and 59; these keep it from happening again.

type Row = { productId: string; slug: string; artist: string; published: boolean };
const rows = products as unknown as Row[];
const deliver = async (): Promise<DeliveryQuote> => ({ amount: 5.99, source: 'set-by-hand' });

describe('every print has an identity of its own', () => {
  it('no two prints share a product id', () => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      expect(seen.get(r.productId), `id ${r.productId}: ${seen.get(r.productId)} and ${r.slug}`).toBeUndefined();
      seen.set(r.productId, r.slug);
    }
  });

  it('no two prints share a slug', () => {
    const slugs = rows.map(r => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  const SIX: [string, string][] = [
    ['through-the-willows', 'Markus Naarttijärvi'],
    ['pines-under-starlight', 'Markus Naarttijärvi'],
    ['boathouses-in-winter', 'Markus Naarttijärvi'],
    ['tjurpannan-bathus', 'Patrik Wennerlund'],
    ['wake-up', 'Patrik Wennerlund'],
    ['moody-19-the-crow', 'Patrik Wennerlund'],
  ];

  it.each(SIX)('records %s as itself, by slug and by id', async (slug, artist) => {
    const product = (await getAllProducts()).find(p => p.slug === slug)!;
    expect(product.artist).toBe(artist);
    const size = Object.keys(product.prices ?? {})[0];
    for (const item of [
      { productId: product.id, slug, size, quantity: 1 },
      { productId: product.id, size, quantity: 1 },
    ]) {
      const order = await computeOrderAmount([item], 'GBP', 'GB', undefined, async () => null, deliver);
      expect(order.items[0].slug).toBe(slug);
    }
  });

  it('a basket saved with an old shared id still resolves by its slug', async () => {
    const order = await computeOrderAmount(
      [{ productId: '43', slug: 'tjurpannan-bathus', size: '40x50cm', quantity: 1 }],
      'GBP', 'GB', undefined, async () => null, deliver
    );
    expect(order.items[0].slug).toBe('tjurpannan-bathus');
  });
});
