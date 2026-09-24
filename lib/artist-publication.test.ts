import { afterEach, describe, expect, it, vi } from 'vitest';
import { artists } from '@/data/artists';
import { getShopProductsByArtist } from '@/lib/products';
import ArtistPage, { generateMetadata as englishMetadata, generateStaticParams as englishParams } from '@/app/(en)/artist/[slug]/page';
import NorwegianArtistPage, { generateMetadata as norwegianMetadata, generateStaticParams as norwegianParams } from '@/app/(no)/no/artist/[slug]/page';

vi.mock('@/lib/products', () => ({ getShopProductsByArtist: vi.fn() }));

afterEach(() => vi.resetAllMocks());

describe('artists without published prints', () => {
  it('emit neither profile metadata nor Person JSON-LD in either language', async () => {
    vi.mocked(getShopProductsByArtist).mockResolvedValue([]);
    const props = { params: Promise.resolve({ slug: artists[0].slug }) };
    expect(await englishMetadata(props)).toEqual({});
    expect(await norwegianMetadata(props)).toEqual({});
    expect(await englishParams()).toEqual([]);
    expect(await norwegianParams()).toEqual([]);
    await expect(ArtistPage(props)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    await expect(NorwegianArtistPage(props)).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});
