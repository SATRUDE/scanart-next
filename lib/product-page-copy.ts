// English copy for the V2 product page (Figma 116:379 / 187:1609). The
// Norwegian twin lives in lib/i18n/no.ts under productPage.page, typed by the
// interface below so the two can never drift in shape.
//
// Every fact here was checked against the site's own sources before it was
// written: production and delivery times and the 14-day right to cancel from
// data/help.ts, the frame choices from config/frame.ts, and "archival paper"
// from the Help answer on materials. Anything priced is filled in at runtime
// from config/shipping.ts or the catalogue, in the buyer's currency, so none
// of it is typed here.
//
// Placeholders in braces ({count}, {name}, {price}, {label}) are replaced by
// the component that renders the string.

export interface ProductPageStrings {
  breadcrumbHome: string;
  breadcrumbPrints: string;
  readMore: string;
  readLess: string;
  /** The panel's three rows (Question 238:4065). */
  questions: {
    details: string;
    delivery: string;
    /** "About {name}" */
    about: string;
  };
  /** Details: "{sizes}, printed to order on …". */
  detailsBody: string;
  detailsFrames: string;
  deliveryBody: string;
  returnsBody: string;
  deliveryLink: string;
  /** "All prints by {name}" */
  aboutLink: string;
  /** Artist section fact rows (Fact row 237:3728). */
  facts: {
    basedIn: string;
    sizes: string;
    inTheShop: string;
    /** "{count} prints, from", then the price in the buyer's currency. */
    printsFromOne: string;
    printsFromOther: string;
  };
  /** "All {count} prints" under the artist facts. */
  allPrintsOne: string;
  allPrintsOther: string;
  moreLikeThis: string;
  /** "All {label}", the category link on the section header. */
  allInCategory: string;
}

/** The client-side gallery and lightbox (Figma 116:534 / 115:442). */
export interface GalleryStrings {
  /** "All {count} images" on the second image (desktop, more than two). */
  allImages: string;
  /** "{count} images" beside the print's name in the lightbox. */
  imageCount: string;
  close: string;
  previous: string;
  next: string;
  /** Lightbox captions, by what the image is. */
  captions: { print: string; scene: string; video: string };
}

export const productPageEn: ProductPageStrings = {
  breadcrumbHome: 'Home',
  breadcrumbPrints: 'Art Prints',
  readMore: 'Read more',
  readLess: 'Read less',
  questions: {
    details: 'Details',
    delivery: 'Delivery and returns',
    about: 'About {name}',
  },
  detailsBody: '{sizes}, printed to order on museum-quality archival paper.',
  detailsFrames:
    'Choose it unframed, or in a wood, black or white frame. The frame price depends on the size and is added to the price above.',
  deliveryBody:
    'Each print is made to order, so allow 1 to 4 business days for production, plus delivery for your region: United Kingdom 2-3 business days; Norway, Denmark and Sweden 3-5; United States 5-7; rest of world 7-14. Delivery is calculated at checkout.',
  returnsBody:
    "You have 14 days from receiving your order to change your mind. Because prints are made to order, you don't need to send anything back: email us and we'll refund you.",
  deliveryLink: 'Delivery and returns in full',
  aboutLink: 'All prints by {name}',
  facts: {
    basedIn: 'Based in',
    sizes: 'Sizes',
    inTheShop: 'In the shop',
    printsFromOne: '{count} print, from',
    printsFromOther: '{count} prints, from',
  },
  allPrintsOne: 'The print',
  allPrintsOther: 'All {count} prints',
  moreLikeThis: 'More prints like this',
  allInCategory: 'All {label}',
};

export const galleryEn: GalleryStrings = {
  allImages: 'All {count} images',
  imageCount: '{count} images',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  captions: {
    print: 'The print',
    scene: 'Framed, in a room setting',
    video: 'Framed, as the light moves',
  },
};

/** Replaces {key} placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in values ? String(values[key]) : m));
}
