'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { getFramePrice } from '@/config/frame';
import { getProductPrices } from '@/lib/pricing';
import type { Orientation, OrientationOption } from '@/lib/print-options';

export interface Product {
  id: string;
  name: string;
  slug: string; // URL-friendly version of the name
  prices: {
    [key: string]: {
      GBP: number;
      NOK: number;
      USD: number;
      DKK: number;
      SEK: number;
      EUR: number;
    };
  };
  /** The price list (Premium, Budget, Entry): the per-country euro prices
   *  are keyed by it. Absent on a basket saved before 24 Nov 2026, which then
   *  shows the EUR list until checkout prices it. */
  priceCategory?: string;
  image: string;
  secondaryImage?: string;
  description: string;
  category: string;
  brand: string;
  artist?: string;
  artistId?: string;
  inStock: boolean;
  published?: boolean; // Optional for backward compatibility with static products
  featured?: boolean; // Optional for backward compatibility with static products
  sizes?: {
    [key: string]: boolean;
  };
  recommendedProducts?: string[]; // Array of product names to recommend
  /** Portrait and landscape, where the print offers both (lib/print-options.ts). */
  orientations?: OrientationOption[];
  /** Sold without a frame only (lib/print-options.ts). */
  unframedOnly?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  frame?: string;
  /** Set only on a print that offers a choice (lib/print-options.ts). */
  orientation?: Orientation;
}

/** One basket line is one print in one size, frame and orientation. */
const sameLine = (item: CartItem, productId: string, size?: string, frame?: string, orientation?: Orientation) =>
  item.product.id === productId && item.size === size && item.frame === frame && item.orientation === orientation;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_TO_CART'; product: Product; quantity?: number; size?: string; frame?: string; orientation?: Orientation }
  | { type: 'REMOVE_FROM_CART'; productId: string; size?: string; frame?: string; orientation?: Orientation }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number; size?: string; frame?: string; orientation?: Orientation }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'CLOSE_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      if (action.product.published === false) return state;
      const existingItem = state.items.find(item => sameLine(item, action.product.id, action.size, action.frame, action.orientation));
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            sameLine(item, action.product.id, action.size, action.frame, action.orientation)
              ? { ...item, quantity: item.quantity + (action.quantity || 1) }
              : item
          ),
        };
      }
      
      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: action.quantity || 1,
            size: action.size,
            frame: action.frame,
            ...(action.orientation ? { orientation: action.orientation } : {}),
          },
        ],
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => !sameLine(item, action.productId, action.size, action.frame, action.orientation)),
      };
    
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => !sameLine(item, action.productId, action.size, action.frame, action.orientation)),
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          sameLine(item, action.productId, action.size, action.frame, action.orientation)
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    
    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false,
      };
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addToCart: (product: Product, quantity?: number, size?: string, frame?: string, orientation?: Orientation) => void;
  removeFromCart: (productId: string, size?: string, frame?: string, orientation?: Orientation) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, frame?: string, orientation?: Orientation) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  /** `country` prices euro for that country (config/eur-countries.ts). */
  getTotalPriceInCurrency: (currency: 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK' | 'EUR', country?: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper functions for localStorage
function loadCartFromStorage() {
  try {
    const data = localStorage.getItem('scanart-cart');
    if (data) {
      // A basket saved before the euro list (24 Nov 2026) carries prices with
      // no EUR, which would show every line at €0 to a euro visitor while
      // checkout charges the real price; one saved before the per-country
      // euro prices has no price list, so it would show the EUR list while a
      // main EU market is charged its own. Those lines are dropped for euro
      // visitors; everyone else keeps their basket as it was.
      const inEuro = /(?:^|;\s*)geo-country=EU(?:;|$)/.test(document.cookie);
      return (JSON.parse(data) as CartItem[]).filter(
        item => item.product.published !== false && (!inEuro || (getProductPrices(item.product, item.size).EUR > 0 && !!item.product.priceCategory))
      );
    }
  } catch { /* ignore */ }
  return [];
}
function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem('scanart-cart', JSON.stringify(items));
  } catch { /* ignore */ }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: loadCartFromStorage(),
    isOpen: false,
  });

  useEffect(() => {
    saveCartToStorage(state.items);
  }, [state.items]);

  const addToCart = (product: Product, quantity = 1, size?: string, frame?: string, orientation?: Orientation) => {
    dispatch({ type: 'ADD_TO_CART', product, quantity, size, frame, orientation });
  };

  const removeFromCart = (productId: string, size?: string, frame?: string, orientation?: Orientation) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId, size, frame, orientation });
  };

  const updateQuantity = (productId: string, quantity: number, size?: string, frame?: string, orientation?: Orientation) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity, size, frame, orientation });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const closeCart = () => {
    dispatch({ type: 'CLOSE_CART' });
  };

  const getTotalItems = () => {
    return state.items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total: number, item: CartItem) => {
      let price = 0;

      if (item.size && item.product.prices[item.size]) {
        price = item.product.prices[item.size].GBP || 0;
      } else {
        const availablePrices = Object.keys(item.product.prices);
        if (availablePrices.length > 0) {
          const firstPriceKey = availablePrices[0];
          price = item.product.prices[firstPriceKey].GBP || 0;
        }
      }

      const frameCost = item.frame ? getFramePrice(item.frame, item.size, 'GBP') : 0;

      return total + ((price + frameCost) * item.quantity);
    }, 0);
  };

  const getTotalPriceInCurrency = (currency: 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK' | 'EUR', country?: string) => {
    const total = state.items.reduce((total: number, item: CartItem) => {
      // The size's price, or the first one for a single-size product, with
      // the country's own euro figure where it has one.
      const price = getProductPrices(item.product, item.size, country)[currency] || 0;

      // Add frame cost
      const frameCost = item.frame ? getFramePrice(item.frame, item.size, currency, country) : 0;
      
      return total + ((price + frameCost) * item.quantity);
    }, 0);
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
        getTotalItems,
        getTotalPrice,
        getTotalPriceInCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};