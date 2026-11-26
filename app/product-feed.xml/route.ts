import { feedAdditionalImages, feedMainImage } from '@/lib/feed-images';
import { getAllProducts } from '@/lib/products';
import { getLowestProductPrices } from '@/lib/pricing';
import { productListingDetails } from '@/lib/product-listing-details';
import { unframedOffer } from '@/lib/sale-promotion';
import { isSaleOn } from '@/lib/server/sale-promotion';
import { BASE_URL } from '@/lib/site';

// Google Merchant Center product feed (RSS 2.0 + g: namespace) for free
// listings on the Shopping tab and image-search overlays. One item per print
// at its lowest GBP price; art prints have no GTIN/MPN, so identifier_exists
// is false and brand carries the artist. Prerendered at build like the rest
// of the catalogue (products are baked JSON), so it updates on deploy, and
// regenerated at most every ten minutes after that so the sale price below
// follows NORDIC20 being switched on or off in the store without a deploy.
export const dynamic = 'force-static';
export const revalidate = 600;

const GOOGLE_PRODUCT_CATEGORY = 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork';

// Every item here is the UNFRAMED print at its lowest price (frames are priced
// on top, config/frame.ts, and never enter the feed). Free delivery over
// GBP 100 is for baskets with no framed print (config/free-delivery.ts), so
// Merchant Center's free-delivery shipping service is scoped to this label
// and nothing else: if a framed offer is ever added to the feed it must carry
// a different label, and then Google can never show it with free delivery.
const SHIPPING_LABEL = 'unframed';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const products = await getAllProducts();
  // While NORDIC20 is on, every item is on sale: the sale is 20% off unframed
  // prints and every item here is the unframed print. Google's sale_price
  // rule: submit the full price as price and the price the landing page and
  // checkout charge as sale_price, or the item is disapproved. The sale has
  // no end date, so no sale_price_effective_date (optional, and the sale
  // price then applies at once). Off, items carry the full price only.
  const saleOn = await isSaleOn();

  const items = products
    .map(p => {
      const price = getLowestProductPrices(p).GBP;
      if (!price) return null;
      const offer = unframedOffer(price, saleOn);
      const salePrice = offer.was === undefined ? '' : `
      <g:sale_price>${offer.price.toFixed(2)} GBP</g:sale_price>`;
      const detail = productListingDetails(p);
      const title = detail?.title ?? `${p.name} by ${p.artist || p.brand}, Scandinavian Art Print`;
      const description = [p.description || `${p.name} by ${p.artist || p.brand}.`, detail?.summary].filter(Boolean).join(' ');
      const listingAttributes = detail ? `
      <g:structured_title><g:digital_source_type>trained_algorithmic_media</g:digital_source_type><g:content>${esc(title)}</g:content></g:structured_title>
      <g:structured_description><g:digital_source_type>trained_algorithmic_media</g:digital_source_type><g:content>${esc(description)}</g:content></g:structured_description>
      <g:product_type>${esc(detail.productType)}</g:product_type>
      <g:size>${esc(detail.size)}</g:size>
      <g:color>${esc(detail.colour)}</g:color>
      <g:material>${esc(detail.material)}</g:material>` : '';
      // The print on the warm backdrop, as the product page shows it (Hummer
      // keeps its unframed render, see feedMainImage).
      const primaryImage = feedMainImage(p);
      const additionalImages = feedAdditionalImages(p)
        .map(url => `\n      <g:additional_image_link>${esc(url)}</g:additional_image_link>`)
        .join('');
      return `    <item>
      <g:id>${esc(p.slug)}</g:id>
      <g:title>${esc(title)}</g:title>
      <g:description>${esc(description)}</g:description>${listingAttributes}
      <g:link>${BASE_URL}/product/${esc(p.slug)}</g:link>
      <g:image_link>${BASE_URL}${esc(primaryImage)}</g:image_link>${additionalImages}
      <g:price>${price.toFixed(2)} GBP</g:price>${salePrice}
      <g:availability>${p.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${esc(p.artist || p.brand || 'Scandinavian Art Gallery')}</g:brand>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>${esc(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>
      <g:shipping_label>${SHIPPING_LABEL}</g:shipping_label>
    </item>`;
    })
    .filter(Boolean)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Scandinavian Art Gallery</title>
    <link>${BASE_URL}</link>
    <description>Art prints by independent Scandinavian artists, framed or unframed, delivered worldwide.</description>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
