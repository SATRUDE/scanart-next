import { siteImage } from '@/lib/product-sitemap-images';

/**
 * The image formats Merchant Center will fetch. AVIF is deliberately absent:
 * Google's image requirements list JPEG, WebP, PNG, GIF, BMP and TIFF, and an
 * item whose image it cannot decode is disapproved rather than shown without a
 * picture.
 *
 * Every room scene in the catalogue is AVIF and only AVIF (PR #198 made them
 * genuinely AVIF on purpose), so the scene reaches the feed through a committed
 * WebP twin of the same file: same picture, same pixels, a container Google
 * accepts. The site keeps serving AVIF to humans; nothing about the page
 * changes.
 */
const MERCHANT_CENTER_FORMATS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
]);

function extensionOf(src: string): string {
  const dot = src.lastIndexOf('.');
  return dot === -1 ? '' : src.slice(dot).toLowerCase();
}

/**
 * The path Merchant Center should be given for an image we hold, or undefined
 * when we have nothing it can read.
 *
 * Serving the AVIF through the Next image optimiser is not an option here: the
 * output format is content-negotiated from the Accept header and
 * `next.config.ts` lists AVIF first, so a crawler that accepts AVIF is handed
 * back the format that fails. The twin has to be a real file.
 */
export function merchantCenterImagePath(src: string | undefined): string | undefined {
  const trimmed = src?.trim();
  if (!trimmed) return undefined;

  const ext = extensionOf(trimmed);
  if (MERCHANT_CENTER_FORMATS.has(ext)) return trimmed;
  if (ext === '.avif') return `${trimmed.slice(0, -ext.length)}.webp`;

  // An extension we have not taught this function is not silently guessed at:
  // a wrong g:additional_image_link is an item-level disapproval.
  return undefined;
}

/**
 * The extra images a feed item offers beyond `g:image_link`, as absolute URLs.
 *
 * Today that is the room scene, which is the whole point of the attribute:
 * Google's additional_image_link guidance asks for lifestyle staging, and the
 * scenes are already what earns our image-search reach. `g:image_link` stays
 * the artwork on white, which is what its own guidance asks for.
 *
 * Deduped against the main image the same way `productSitemapImages` is, since
 * a product whose secondary image is its primary one has nothing extra to
 * offer.
 */
export function feedAdditionalImages(product: {
  image: string;
  secondaryImage?: string;
}): string[] {
  const main = siteImage(product.image);
  const scene = siteImage(merchantCenterImagePath(product.secondaryImage));
  if (!scene || scene === main) return [];
  return [scene];
}
