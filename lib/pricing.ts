// Helper functions for handling size-based pricing

export function getProductPrice(product: any, size?: string, currency: 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK' = 'GBP'): number {
  if (!product || !product.prices) return 0;
  
  // If size is specified and exists in the product prices, use it
  if (size && product.prices[size]) {
    return product.prices[size][currency] || 0;
  }
  
  // Fallback to 'default' pricing if no size-specific price exists
  if (product.prices['default']) {
    return product.prices['default'][currency] || 0;
  }
  
  // Fallback to first available price key
  const availableKeys = Object.keys(product.prices);
  if (availableKeys.length > 0) {
    const firstKey = availableKeys[0];
    return product.prices[firstKey][currency] || 0;
  }
  
  return 0;
}

export function getProductPrices(product: any, size?: string): { GBP: number; NOK: number; USD: number; DKK: number; SEK: number } {
  if (!product || !product.prices) {
    return { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0 };
  }
  
  // If size is specified and exists in the product prices, use it
  if (size && product.prices[size]) {
    return product.prices[size];
  }
  
  // Fallback to 'default' pricing if no size-specific price exists
  if (product.prices['default']) {
    return product.prices['default'];
  }
  
  // Fallback to first available price key
  const availableKeys = Object.keys(product.prices);
  if (availableKeys.length > 0) {
    const firstKey = availableKeys[0];
    return product.prices[firstKey];
  }
  
  return { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0 };
}

export function getLowestProductPrice(product: any, currency: 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK' = 'GBP'): number {
  if (!product || !product.prices) return 0;
  
  const prices = Object.values(product.prices).map((priceObj: any) => priceObj[currency] || 0);
  return Math.min(...prices);
}

export function getLowestProductPrices(product: any): { GBP: number; NOK: number; USD: number; DKK: number; SEK: number } {
  if (!product || !product.prices) {
    console.log('❌ getLowestProductPrices: No product or prices found:', product);
    return { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0 };
  }
  
  console.log('🔍 getLowestProductPrices: Product prices object:', product.prices);
  
  const currencies = ['GBP', 'NOK', 'USD', 'DKK', 'SEK'] as const;
  const result: any = {};
  
  currencies.forEach(currency => {
    const pricesForCurrency = Object.values(product.prices).map((priceObj: any) => priceObj[currency] || 0);
    result[currency] = Math.min(...pricesForCurrency);
    console.log(`   - Lowest price for ${currency}: ${result[currency]}`);
  });
  
  console.log('💰 getLowestProductPrices: Final lowest prices result:', result);
  return result;
}
