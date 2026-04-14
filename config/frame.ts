// Frame pricing configuration
// Easy to edit prices for each currency

export interface FrameOption {
  id: string;
  name: string;
  prices: {
    GBP: number;
    USD: number;
    NOK: number;
    DKK: number;
    SEK: number;
  };
}

export const frameOptions: FrameOption[] = [
  {
    id: 'no-frame',
    name: 'No Frame',
    prices: {
      GBP: 0,
      USD: 0,
      NOK: 0,
      DKK: 0,
      SEK: 0
    }
  },
  {
    id: 'wood',
    name: 'Wood',
    prices: {
      GBP: 25,
      USD: 32,
      NOK: 343,
      DKK: 219,
      SEK: 343
    }
  },
  {
    id: 'black',
    name: 'Black',
    prices: {
      GBP: 25,
      USD: 32,
      NOK: 343,
      DKK: 219,
      SEK: 343
    }
  },
  {
    id: 'white',
    name: 'White',
    prices: {
      GBP: 25,
      USD: 32,
      NOK: 343,
      DKK: 219,
      SEK: 343
    }
  }
];

export const getFramePrice = (frameId: string, currency: 'GBP' | 'USD' | 'NOK' | 'DKK' | 'SEK'): number => {
  const frame = frameOptions.find(f => f.id === frameId);
  return frame ? frame.prices[currency] : 0;
};

export const getFrameName = (frameId: string): string => {
  const frame = frameOptions.find(f => f.id === frameId);
  return frame ? frame.name : 'No Frame';
};



