// The one code Mark has explicitly approved for public promotion. Other
// discount codes remain private in the store. The store still decides whether
// this promotion is active, and the server still decides what is charged:
// the helpers below only show the price the server will charge, so a buyer
// sees the saving before checkout and never has to type the code.
export const SALE_CODE = 'NORDIC20';
export const SALE_PERCENT = 20;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The saving on an unframed amount, rounded as the server rounds it. */
export function saleDiscount(amount: number): number {
  return round2(amount * SALE_PERCENT / 100);
}

/** An unframed amount with the sale taken off. */
export function salePrice(amount: number): number {
  return round2(amount - saleDiscount(amount));
}

/** The same, for a price in every currency at once (formatPrice's shape). */
export function salePrices<T extends { [K in keyof T]: number }>(prices: T): T {
  return Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, salePrice(v as number)])) as T;
}

export function isSalePromotionActive(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const discount = value as Record<string, unknown>;
  return discount.valid === true && discount.code === SALE_CODE
    && discount.percentage === 20 && discount.scope === 'UNFRAMED';
}

export const salePromotionStrings = {
  en: {
    announcement: '20% off all unframed prints. Already taken off.',
    heading: '20% off unframed prints',
    body: 'The prices you see already include it. Frames and delivery are full price.',
    cta: 'See the prints',
    delivery: 'Delivery and returns',
    imageAlt: 'Eye Nose Eye by Simen Wahlqvist, shown framed above a desk. The offer applies to unframed prints only.',
    off: '20% off',
    was: 'Was',
    unframedOnly: 'The 20% off is on unframed prints.',
    basketLine: '20% off unframed (NORDIC20)',
    applied: 'Discount applied',
  },
  no: {
    announcement: '20 % rabatt på alle trykk uten ramme. Allerede trukket fra.',
    heading: '20 % rabatt på trykk uten ramme',
    body: 'Prisene du ser er allerede redusert. Rammer og frakt har ordinær pris.',
    cta: 'Se trykkene',
    delivery: 'Levering og retur',
    imageAlt: 'Eye Nose Eye av Simen Wahlqvist, vist med ramme over et skrivebord. Tilbudet gjelder bare trykk uten ramme.',
    off: '20 % rabatt',
    was: 'Før',
    unframedOnly: 'De 20 % gjelder trykk uten ramme.',
    basketLine: '20 % rabatt uten ramme (NORDIC20)',
    applied: 'Rabatt brukt',
  },
} as const;
