import { describe, it, expect } from 'vitest';
import { BASE_URL } from './site';
import { collectionPageJsonLd, faqPageJsonLd, landingBreadcrumbJsonLd, productUrl } from './landing-jsonld';

// The Norwegian landings described the English site until the V2 build: every
// ItemList entry was /product/<slug> and the breadcrumb's middle step was
// /products (docs/v2-seo.md, "Fixed along the way"). No test renders a page's
// JSON-LD, so the builder the pages share is where this is pinned.
describe('landing JSON-LD', () => {
  const products = [{ slug: 'dragon', name: 'Dragon' }, { slug: 'dancer', name: 'Dancer' }];

  it('points a Norwegian ItemList at the Norwegian product pages', () => {
    const ld = collectionPageJsonLd({ name: 'x', description: 'y', path: '/no/category/abstract', locale: 'no', inLanguage: 'no', products });
    const urls = ld.mainEntity.itemListElement.map(e => e.url);
    expect(urls).toEqual([`${BASE_URL}/no/product/dragon`, `${BASE_URL}/no/product/dancer`]);
    expect(ld.url).toBe(`${BASE_URL}/no/category/abstract`);
    expect(ld.inLanguage).toBe('no');
  });

  it('keeps the English ItemList on the English product pages', () => {
    const ld = collectionPageJsonLd({ name: 'x', description: 'y', path: '/category/abstract', locale: 'en', products });
    expect(ld.mainEntity.itemListElement[0]).toEqual({ '@type': 'ListItem', position: 1, url: `${BASE_URL}/product/dragon`, name: 'Dragon' });
    expect('inLanguage' in ld).toBe(false);
  });

  it('keeps every step of a Norwegian breadcrumb inside /no', () => {
    const ld = landingBreadcrumbJsonLd({ locale: 'no', homeName: 'Hjem', productsName: 'Alle trykk', name: 'Stue', path: '/no/collection/living-room' });
    expect(ld.itemListElement.map(e => e.item)).toEqual([
      `${BASE_URL}/no`,
      `${BASE_URL}/no/products`,
      `${BASE_URL}/no/collection/living-room`,
    ]);
  });

  it('keeps the English breadcrumb as it was', () => {
    const ld = landingBreadcrumbJsonLd({ locale: 'en', homeName: 'Home', productsName: 'Art Prints', name: 'Kitchen', path: '/collection/kitchen' });
    expect(ld.itemListElement.map(e => e.item)).toEqual([BASE_URL, `${BASE_URL}/products`, `${BASE_URL}/collection/kitchen`]);
  });

  it('builds the FAQPage from the visible questions', () => {
    const ld = faqPageJsonLd([{ question: 'Q?', answer: 'A.' }], 'nb-NO');
    expect(ld.inLanguage).toBe('nb-NO');
    expect(ld.mainEntity).toEqual([{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }]);
  });

  it('builds absolute product URLs for either tree', () => {
    expect(productUrl('dragon', 'en')).toBe(`${BASE_URL}/product/dragon`);
    expect(productUrl('dragon', 'no')).toBe(`${BASE_URL}/no/product/dragon`);
  });
});
