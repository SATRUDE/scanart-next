import { feedAdditionalImages } from '@/lib/feed-images';
import { getAllProducts } from '@/lib/products';
import { getLowestProductPrices } from '@/lib/pricing';
import { BASE_URL } from '@/lib/site';

// Google Merchant Center product feed (RSS 2.0 + g: namespace) for free
// listings on the Shopping tab and image-search overlays. One item per print
// at its lowest GBP price; art prints have no GTIN/MPN, so identifier_exists
// is false and brand carries the artist. Prerendered at build like the rest
// of the catalogue (products are baked JSON), so it updates on deploy.
export const dynamic = 'force-static';

const GOOGLE_PRODUCT_CATEGORY = 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const products = await getAllProducts();

  const items = products
    .map(p => {
      const price = getLowestProductPrices(p).GBP;
      if (!price) return null;
      // g:image_link is the artwork on white, which is what Google asks a main
      // product image to be. The room scene goes in as an additional image,
      // which is what its guidance asks for and the picture that actually earns
      // our image-search impressions.
      const additionalImages = feedAdditionalImages(p)
        .map(url => `\n      <g:additional_image_link>${esc(url)}</g:additional_image_link>`)
        .join('');
      return `    <item>
      <g:id>${esc(p.slug)}</g:id>
      <g:title>${esc(`${p.name} by ${p.artist || p.brand}, Scandinavian Art Print`)}</g:title>
      <g:description>${esc(p.description || `${p.name} by ${p.artist || p.brand}.`)}</g:description>
      <g:link>${BASE_URL}/product/${esc(p.slug)}</g:link>
      <g:image_link>${BASE_URL}${esc(p.image)}</g:image_link>${additionalImages}
      <g:price>${price.toFixed(2)} GBP</g:price>
      <g:availability>${p.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${esc(p.artist || p.brand || 'Scandinavian Art Gallery')}</g:brand>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>${esc(GOOGLE_PRODUCT_CATEGORY)}</g:google_product_category>
    </item>`;
    })
    .filter(Boolean)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Scandinavian Art Gallery</title>
    <link>${BASE_URL}</link>
    <description>Art prints by independent Norwegian artists, framed or unframed, delivered worldwide.</description>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
