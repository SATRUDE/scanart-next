/** Verified descriptions for the first five-print Merchant Center trial. */
const DETAILS: Record<string, {
  subject: string;
  colour: string;
  subjectNo: string;
  colourNo: string;
  productType: string;
}> = {
  'sunday-brunch': {
    subject: 'Kitchen Art Print', colour: 'Blue/Green/Pink',
    subjectNo: 'Kunsttrykk til kjøkkenet', colourNo: 'blått, grønt og rosa',
    productType: 'Art Prints > Food & Drink > Kitchen Art',
  },
  'rosa-blomster': {
    subject: 'Pink Floral Art Print', colour: 'Pink/Red/Green',
    subjectNo: 'Kunsttrykk med rosa blomster', colourNo: 'rosa, rødt og grønt',
    productType: 'Art Prints > Botanical > Flowers',
  },
  'massa-applen': {
    subject: 'Apple Kitchen Art Print', colour: 'Red/Green',
    subjectNo: 'Kunsttrykk med epler til kjøkkenet', colourNo: 'rødt og grønt',
    productType: 'Art Prints > Food & Drink > Fruit',
  },
  'small-house-big-ocean': {
    subject: 'Black and White Coastal Art Print', colour: 'Black/White',
    subjectNo: 'Kunsttrykk av kystlandskap i svart-hvitt', colourNo: 'svart og hvitt',
    productType: 'Art Prints > Landscapes > Coastal Art',
  },
  'mean-snothing': {
    subject: 'Humorous Illustration Art Print', colour: 'Green/Orange',
    subjectNo: 'Humoristisk illustrasjon som kunsttrykk', colourNo: 'grønt og oransje',
    productType: 'Art Prints > Illustrations > Humour',
  },
};

interface ListingProduct {
  slug: string;
  name: string;
  artist?: string;
  brand?: string;
  sizes?: Record<string, boolean>;
}

export function productListingDetails(product: ListingProduct, locale: 'en' | 'no' = 'en') {
  const detail = DETAILS[product.slug];
  const sizes = Object.entries(product.sizes ?? {}).filter(([, available]) => available);
  // These five currently have one size. Never attach a stale size to the
  // lowest-price offer if the catalogue later gains a second variant.
  if (!detail || sizes.length !== 1) return undefined;
  const match = /^(\d+)x(\d+)cm$/.exec(sizes[0][0]);
  if (!match) return undefined;
  const size = `${match[1]} x ${match[2]} cm`;
  const displaySize = size.replace(' x ', ' × ');
  return {
    title: `${product.name} ${detail.subject} by ${product.artist || product.brand}, ${size}, Unframed`,
    size,
    colour: detail.colour,
    material: 'Paper',
    productType: detail.productType,
    summary: locale === 'no'
      ? `${detail.subjectNo}, ${displaySize}, på 200 g ubestrøket papir. Farger: ${detail.colourNo}. Grunnprisen er uten ramme; ramme kan velges som tillegg.`
      : `${detail.subject}, ${displaySize}, on 200gsm uncoated paper. Colours: ${detail.colour.toLowerCase().replaceAll('/', ', ')}. Base price is unframed; optional framing available.`,
  };
}
