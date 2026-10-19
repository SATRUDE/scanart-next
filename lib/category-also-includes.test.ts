import { describe, it, expect } from 'vitest';
import { getAllProducts, getShopProductsForLanding } from './products';
import { categoryLandings, getCategoryLandingBySlug } from './categories';

// A landing can show prints from another category without moving them
// (T-0202, Mark 19 Oct 2026). A slug that stops matching a print would drop out
// silently, so check every one against the catalogue.
describe('category landings: alsoIncludes', () => {
  it('names only prints that exist and belong to another category', async () => {
    const bySlug = new Map((await getAllProducts()).map(p => [p.slug, p]));
    for (const landing of categoryLandings) {
      for (const slug of landing.alsoIncludes ?? []) {
        const product = bySlug.get(slug);
        expect(product, `${landing.slug}: ${slug}`).toBeDefined();
        expect(product!.category, `${landing.slug}: ${slug}`).not.toBe(landing.category);
      }
    }
  });

  it('shows the Abstract prints first, then the extra ones, without moving them', async () => {
    const abstract = getCategoryLandingBySlug('abstract')!;
    const slugs = (await getShopProductsForLanding(abstract)).map(p => p.slug);
    expect(slugs[0]).toBe('desert-circles');
    expect(slugs).toEqual(expect.arrayContaining(['month-of-may', 'frozen-currents', 'sun-over-the-forest']));
    expect(new Set(slugs).size).toBe(slugs.length);

    const botanical = (await getShopProductsForLanding(getCategoryLandingBySlug('botanical')!)).map(p => p.slug);
    const photography = (await getShopProductsForLanding(getCategoryLandingBySlug('photography')!)).map(p => p.slug);
    expect(botanical).toContain('month-of-may');
    expect(photography).toEqual(expect.arrayContaining(['frozen-currents', 'sun-over-the-forest']));
  });
});
