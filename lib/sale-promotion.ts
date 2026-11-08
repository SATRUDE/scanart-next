// The one code Mark has explicitly approved for public promotion. Other
// discount codes remain private in the store. The store still decides whether
// this promotion is active; this is copy, never checkout pricing logic.
export const SALE_CODE = 'NORDIC20';

export function isSalePromotionActive(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const discount = value as Record<string, unknown>;
  return discount.valid === true && discount.code === SALE_CODE
    && discount.percentage === 20 && discount.scope === 'UNFRAMED';
}

export const salePromotionStrings = {
  en: {
    announcement: '20% off unframed prints. Use NORDIC20 at checkout.',
    heading: '20% off unframed prints',
    body: 'Use NORDIC20 at checkout. Frames and delivery are full price.',
    cta: 'See the prints',
    delivery: 'Delivery and returns',
    imageAlt: 'Eye Nose Eye by Simen Wahlqvist, shown framed above a desk. The offer applies to unframed prints only.',
  },
  no: {
    announcement: '20 % rabatt på trykk uten ramme. Bruk NORDIC20 i kassen.',
    heading: '20 % rabatt på trykk uten ramme',
    body: 'Bruk NORDIC20 i kassen. Rammer og frakt har ordinær pris.',
    cta: 'Se trykkene',
    delivery: 'Levering og retur',
    imageAlt: 'Eye Nose Eye av Simen Wahlqvist, vist med ramme over et skrivebord. Tilbudet gjelder bare trykk uten ramme.',
  },
} as const;
