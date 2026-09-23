import fs from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllProducts, getProductsByArtworkIds } from './products';

const dancer = {
  id: '25833fb2-2b5f-8055-8f2f-d773f2ff55bf',
  productId: '7',
  slug: 'dancer',
  name: 'Dancer',
  description: '',
  category: 'Abstract',
  artist: 'Helene Brox',
  artistId: '1',
  brand: '',
  inStock: true,
  featured: false,
  published: true,
  image: '/images/products/dancer.png',
  secondaryImage: '',
  availableSizes: ['50x70cm'],
  priceCategory: 'Premium',
  recommendedProducts: [],
};
const swallowDive = {
  ...dancer,
  id: '25833fb2-2b5f-8081-882a-ed391fd69ec1',
  productId: '9',
  slug: 'swallow-dive',
  name: 'Swallow Dive',
};
const unpublished = {
  ...dancer,
  id: 'unpublished-source-id',
  productId: 'unpublished-cart-id',
  slug: 'unpublished-print',
  published: false,
};

describe('article artwork resolution', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([dancer, swallowDive, unpublished]));
  });

  afterEach(() => vi.restoreAllMocks());

  it('resolves source UUIDs and retains commerce IDs and the existing catalogue data', async () => {
    const products = await getAllProducts();
    const selected = await getProductsByArtworkIds([swallowDive.id, dancer.id]);

    expect(selected).toEqual([products[1], products[0]]);
    expect(selected.map(product => product.id)).toEqual(['9', '7']);
  });

  it('supports slugs in author order rather than catalogue order', async () => {
    const selected = await getProductsByArtworkIds(['swallow-dive', 'dancer']);

    expect(selected.map(product => product.slug)).toEqual(['swallow-dive', 'dancer']);
  });

  it('keeps the first selection when a print is repeated by UUID or slug', async () => {
    const selected = await getProductsByArtworkIds([
      swallowDive.id, 'dancer', 'swallow-dive', dancer.id, swallowDive.id,
    ]);

    expect(selected.map(product => product.slug)).toEqual(['swallow-dive', 'dancer']);
  });

  it('skips unpublished and removed prints without losing the remaining selections', async () => {
    const selected = await getProductsByArtworkIds([
      unpublished.id, 'removed-print', dancer.id, unpublished.slug, 'swallow-dive',
    ]);

    expect(selected.map(product => product.slug)).toEqual(['dancer', 'swallow-dive']);
  });

  it('returns no featured prints when there are no selections', async () => {
    expect(await getProductsByArtworkIds([])).toEqual([]);
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('keeps the catalogue failure visible and returns no featured prints', async () => {
    vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('Catalogue unavailable'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await getProductsByArtworkIds([dancer.id])).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Could not read the catalogue'),
      expect.any(Error),
    );
  });
});
