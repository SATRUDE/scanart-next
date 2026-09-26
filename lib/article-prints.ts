import type { NotionBlock } from '@/lib/articles';
import { getAllProducts } from '@/lib/products';
import { getArtistById } from '@/data/artists';
import { warmImage } from '@/lib/warm-image';
import type { CurrencyPrices } from '@/lib/pricing';

/**
 * What a `print_feature` block carries once resolved: the real catalogue
 * record, never anything the writer typed. Plain data, so the block can cross
 * into a client component (the preview route's ReaderComments) unchanged.
 */
export interface PrintFeatureData {
  slug: string;
  name: string;
  artist?: string;
  brand: string;
  category: string;
  /** The first offered size, the one PrintCard shows, as it reads: '50 × 70 cm'. */
  sizeLabel?: string;
  /** The tile ratio for that size, PrintCard's rule (Figma Print tile 17:89). */
  aspect: 'aspect-square' | 'aspect-[5/4]' | 'aspect-[5/7]';
  /** The warm-backdrop copy of the standard shot (lib/warm-image.ts). */
  image: string;
  prices: { [size: string]: CurrencyPrices };
}

/**
 * PrintCard's sizeLabel and tileAspect, worked out here on the server because
 * PrintCard is a client module: its plain function exports cannot be called
 * from a server component. Keep the two in step.
 */
function sizeFacts(size: string | undefined): Pick<PrintFeatureData, 'sizeLabel' | 'aspect'> {
  const m = size?.match(/^(\d+)x(\d+)cm$/i);
  const aspect = m && m[1] === m[2] ? 'aspect-square' : m && Number(m[1]) > Number(m[2]) ? 'aspect-[5/4]' : 'aspect-[5/7]';
  return { sizeLabel: m ? `${m[1]} × ${m[2]} cm` : size, aspect };
}

/**
 * Fill each `::print[slug]` block (lib/markdown-blocks.ts) from the published
 * catalogue. A slug that is unknown, retired or unpublished drops the block,
 * so a typo or a print leaving the shop shows nothing rather than a broken
 * card. Server-only (it reads the catalogue); run it on the blocks before they
 * reach NotionBlockRenderer.
 */
export async function resolvePrintFeatures<T extends NotionBlock>(blocks: T[]): Promise<T[]> {
  if (!blocks.some((b) => b.type === 'print_feature')) return blocks;
  // getAllProducts is the published catalogue only, with its live prices.
  const bySlug = new Map((await getAllProducts()).map((p) => [p.slug, p]));
  return blocks.flatMap((block) => {
    if (block.type !== 'print_feature') return [block];
    const slug = (block.print_feature as { slug?: string } | undefined)?.slug;
    const product = slug ? bySlug.get(slug) : undefined;
    if (!product || Object.keys(product.prices).length === 0) return [];
    const data: PrintFeatureData = {
      slug: product.slug,
      name: product.name,
      artist: product.artistId ? getArtistById(product.artistId)?.name : undefined,
      brand: product.brand,
      category: product.category,
      ...sizeFacts(Object.keys(product.prices)[0]),
      image: warmImage(product.image),
      prices: product.prices,
    };
    return [{ ...block, print_feature: { slug: product.slug, product: data } }];
  });
}
