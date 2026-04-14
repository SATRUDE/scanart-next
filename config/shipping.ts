import { Country } from '@/contexts/LanguageContext';

export interface ShippingRate {
  countryCode: Country | 'ELSEWHERE';
  countryName: string;
  costs: {
    GBP: number;
    USD: number;
    NOK: number;
    DKK: number;
    SEK: number;
  };
  estimatedDays?: string;
  description?: string;
}

export const shippingRates: ShippingRate[] = [
  {
    countryCode: 'GB',
    countryName: 'Great Britain',
    costs: {
      GBP: 5.99,
      USD: 7.49,
      NOK: 80.87,
      DKK: 52.11,
      SEK: 79.13
    },
    estimatedDays: '2-3 business days',
    description: 'Standard UK delivery'
  },
  {
    countryCode: 'NO',
    countryName: 'Norway',
    costs: {
      GBP: 6.59,
      USD: 8.24,
      NOK: 89,
      DKK: 57.35,
      SEK: 87.12
    },
    estimatedDays: '3-5 business days',
    description: 'Standard Norwegian delivery'
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    costs: {
      GBP: 10.39,
      USD: 12.99,
      NOK: 140.29,
      DKK: 90.39,
      SEK: 137.69
    },
    estimatedDays: '5-7 business days',
    description: 'Standard US delivery'
  },
  {
    countryCode: 'DK',
    countryName: 'Denmark',
    costs: {
      GBP: 6.59,
      USD: 8.24,
      NOK: 89,
      DKK: 57.35,
      SEK: 87.12
    },
    estimatedDays: '3-5 business days',
    description: 'Standard Danish delivery'
  },
  {
    countryCode: 'SE',
    countryName: 'Sweden',
    costs: {
      GBP: 7.33,
      USD: 9.16,
      NOK: 98.89,
      DKK: 63.72,
      SEK: 99
    },
    estimatedDays: '3-5 business days',
    description: 'Standard Swedish delivery'
  },
  {
    countryCode: 'ELSEWHERE',
    countryName: 'Rest of World',
    costs: {
      GBP: 15.99,
      USD: 19.99,
      NOK: 215.89,
      DKK: 139.11,
      SEK: 211.88
    },
    estimatedDays: '7-14 business days',
    description: 'International delivery'
  }
];

/**
 * Get shipping rate for a specific country
 * @param countryCode - The country code to get shipping for
 * @returns Shipping rate object or undefined if not found
 */
export const getShippingRate = (countryCode: Country | 'ELSEWHERE'): ShippingRate | undefined => {
  return shippingRates.find(rate => rate.countryCode === countryCode);
};

/**
 * Get all available shipping rates
 * @returns Array of all shipping rates
 */
export const getAllShippingRates = (): ShippingRate[] => {
  return shippingRates;
};

/**
 * Get shipping cost in specific currency for a country
 * @param countryCode - The country code to get shipping for
 * @param currency - The currency to get the cost in
 * @returns The shipping cost in the specified currency, or 0 if not found
 */
export const getShippingCostInCurrency = (countryCode: Country | 'ELSEWHERE', currency: string): number => {
  const rate = getShippingRate(countryCode);
  if (!rate) return 0;
  
  return rate.costs[currency as keyof typeof rate.costs] || 0;
};

/**
 * Format shipping cost for display
 * @param rate - The shipping rate object
 * @param currency - The currency to format for
 * @returns Formatted price string
 */
export const formatShippingCost = (rate: ShippingRate, currency: string): string => {
  const cost = rate.costs[currency as keyof typeof rate.costs] || 0;
  
  switch (currency) {
    case 'GBP':
      return `£${cost.toFixed(2)}`;
    case 'USD':
      return `$${cost.toFixed(2)}`;
    case 'NOK':
    case 'DKK':
    case 'SEK':
      return `${cost} kr`;
    default:
      return `${cost} ${currency}`;
  }
}; 