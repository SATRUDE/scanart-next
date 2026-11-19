import { beforeEach, describe, expect, it, vi } from 'vitest';
import { offerPrice } from './offer-structured-data';
import { salePrice } from './sale-promotion';
import { getAllProducts } from './products';
import { getLowestProductPrices } from './pricing';

// Google's sale price rules, read 19 Nov 2026:
// - Merchant Center sale_price (support.google.com/merchants/answer/6324471):
//   "15.00 GBP" format, no more than two decimals, less than price, matches
//   the sale price on the landing page and at checkout; keep submitting the
//   full price as price. sale_price_effective_date is optional; without it the
//   sale price applies at once (NORDIC20 has no end date).
// - Merchant listing markup (developers.google.com/search/docs/appearance/
//   structured-data/merchant-listing): offers.price is the active (sale)
//   price, the original goes in a UnitPriceSpecification with priceType
//   https://schema.org/StrikethroughPrice, the active price carries no
//   priceType, and a priceValidUntil on a sale price is read as the sale's end.

let saleOn = true;
vi.mock('@/lib/server/sale-promotion', () => ({ isSaleOn: async () => saleOn }));

async function feedItems(): Promise<Map<string, string>> {
  const { GET } = await import('@/app/product-feed.xml/route');
  const xml = await (await GET()).text();
  const items = new Map<string, string>();
  for (const block of xml.split('<item>').slice(1)) {
    items.set(block.match(/<g:id>([^<]+)<\/g:id>/)![1], block);
  }
  return items;
}

const field = (item: string, name: string) => item.match(new RegExp(`<g:${name}>([^<]+)</g:${name}>`))?.[1];

describe('Merchant Center feed', () => {
  beforeEach(() => { saleOn = true; });

  it('sends a sale_price for every print while NORDIC20 is on, matching the page', async () => {
    const products = await getAllProducts();
    const items = await feedItems();
    expect(items.size).toBeGreaterThan(0);
    for (const [slug, item] of items) {
      const full = getLowestProductPrices(products.find(p => p.slug === slug)!).GBP;
      const price = field(item, 'price')!;
      const sale = field(item, 'sale_price');
      expect(price).toBe(`${full.toFixed(2)} GBP`);
      expect(sale, slug).toMatch(/^\d+\.\d{2} GBP$/);
      // What LocalPrice shows and checkout charges: 20% off, rounded to pence.
      expect(sale).toBe(`${salePrice(full).toFixed(2)} GBP`);
      expect(parseFloat(sale!)).toBeLessThan(parseFloat(price));
      // No end date, so no effective date.
      expect(item).not.toContain('sale_price_effective_date');
      // The sale price sits right after the full price, inside the item.
      expect(item.indexOf('<g:sale_price>')).toBeGreaterThan(item.indexOf('<g:price>'));
    }
    expect(field(items.get('eltsjoen')!, 'sale_price')).toBe('44.80 GBP');
  });

  it('goes back to the full price alone when the sale is switched off', async () => {
    saleOn = false;
    const items = await feedItems();
    for (const item of items.values()) {
      expect(item).not.toContain('sale_price');
      expect(field(item, 'price')).toMatch(/^\d+\.\d{2} GBP$/);
    }
    expect(field(items.get('eltsjoen')!, 'price')).toBe('56.00 GBP');
  });
});

describe('product Offer price markup', () => {
  const from = new Date('2026-11-19T12:00:00Z');

  it('during the sale: the sale price is active and the full price is struck through', () => {
    const ld = offerPrice(56, true, from);
    expect(ld).toEqual({
      priceCurrency: 'GBP',
      price: 44.8,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceType: 'https://schema.org/StrikethroughPrice',
        price: 56,
        priceCurrency: 'GBP',
      },
    });
    expect(ld).not.toHaveProperty('priceValidUntil');
    expect(ld.price).toBeLessThan(56);
  });

  it('off sale: the full price with the rolling validity, as before', () => {
    expect(offerPrice(56, false, from)).toEqual({ priceCurrency: 'GBP', price: 56, priceValidUntil: '2027-11-19' });
  });

  it('agrees with the feed for every print', async () => {
    saleOn = true;
    const products = await getAllProducts();
    const items = await feedItems();
    for (const p of products) {
      const item = items.get(p.slug);
      if (!item) continue;
      const full = getLowestProductPrices(p).GBP;
      expect(`${offerPrice(full, true).price.toFixed(2)} GBP`).toBe(field(item, 'sale_price'));
      expect(`${offerPrice(full, false).price.toFixed(2)} GBP`).toBe(field(item, 'price'));
    }
  });
});
