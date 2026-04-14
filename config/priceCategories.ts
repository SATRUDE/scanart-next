export interface PriceCategory {
  [size: string]: {
    GBP: number;
    USD: number;
    NOK: number;
    DKK: number;
    SEK: number;
  };
}

export const priceCategories: { [category: string]: PriceCategory } = {
  // Standard pricing for most products (42 GBP for 50x50cm, 56 GBP for 50x70cm)
  'Standard': {
    '50x50cm': {
      GBP: 42,
      USD: 54,
      NOK: 600,
      DKK: 370,
      SEK: 600
    },
    '50x70cm': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770
    }
  },

  // Premium pricing for larger sizes (A3, A2, A1 format)
  'Premium': {
    'A3': {
      GBP: 42,
      USD: 54,
      NOK: 577,
      DKK: 367,
      SEK: 577
    },
    'A2': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770
    },
    'A1': {
      GBP: 77,
      USD: 99,
      NOK: 1058,
      DKK: 673,
      SEK: 1058
    },
    '50x50cm': {
      GBP: 42,
      USD: 54,
      NOK: 577,
      DKK: 367,
      SEK: 577
    },
    '50x70cm': {
      GBP: 56,
      USD: 72,
      NOK: 770,
      DKK: 490,
      SEK: 770
    }
  },

  // Budget pricing for smaller/standard products
  'Budget': {
    '50x50cm': {
      GBP: 35,
      USD: 45,
      NOK: 480,
      DKK: 307,
      SEK: 480
    },
    '50x70cm': {
      GBP: 45,
      USD: 58,
      NOK: 617,
      DKK: 395,
      SEK: 617
    }
  },

  // High-end pricing for premium products (including the typo "Luxary")
  'Luxary': {
    'A3': {
      GBP: 60,
      USD: 77,
      NOK: 823,
      DKK: 526,
      SEK: 823
    },
    'A2': {
      GBP: 80,
      USD: 103,
      NOK: 1100,
      DKK: 703,
      SEK: 1100
    },
    'A1': {
      GBP: 110,
      USD: 141,
      NOK: 1500,
      DKK: 960,
      SEK: 1500
    },
    '50x50cm': {
      GBP: 60,
      USD: 77,
      NOK: 823,
      DKK: 526,
      SEK: 823
    },
    '50x70cm': {
      GBP: 80,
      USD: 103,
      NOK: 1100,
      DKK: 703,
      SEK: 1100
    }
  }
};

// Helper function to get prices for a specific category and size
export const getPriceForCategory = (category: string, size: string) => {
  const categoryPrices = priceCategories[category];
  if (!categoryPrices) {
    console.warn(`Price category '${category}' not found`);
    return null;
  }
  
  const sizePrices = categoryPrices[size];
  if (!sizePrices) {
    console.warn(`Size '${size}' not found in category '${category}'`);
    return null;
  }
  
  return sizePrices;
};

// Helper function to get all available sizes for a category
export const getSizesForCategory = (category: string): string[] => {
  const categoryPrices = priceCategories[category];
  if (!categoryPrices) {
    return [];
  }
  return Object.keys(categoryPrices);
};

// Helper function to get all available price categories
export const getAvailablePriceCategories = (): string[] => {
  return Object.keys(priceCategories);
};
