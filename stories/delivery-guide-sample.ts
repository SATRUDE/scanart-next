import type { DeliveryGuide } from '@/lib/delivery-guide';

// The store's from-prices as measured on 2026-09-26, for stories only. The
// site computes the real ones at render (lib/server/delivery-guide.ts).
export const sampleDeliveryGuide: DeliveryGuide = {
  GB: { GBP: 5.99, NOK: 80, USD: 8.5, DKK: 55, SEK: 80 },
  NO: { GBP: 8, NOK: 100, USD: 11, DKK: 70, SEK: 100 },
  SE: { GBP: 7, NOK: 90, USD: 9.5, DKK: 60, SEK: 90 },
  DK: { GBP: 8, NOK: 100, USD: 10.5, DKK: 70, SEK: 100 },
  US: { GBP: 4.5, NOK: 55, USD: 6, DKK: 40, SEK: 55 },
  ELSEWHERE: { GBP: 4.5, NOK: 55, USD: 6, DKK: 40, SEK: 55 },
};
