'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = 'GBP' | 'NOK' | 'USD' | 'DKK' | 'SEK';
export type Country = 'GB' | 'NO' | 'US' | 'DK' | 'SE';

export interface CountryInfo {
  code: Country;
  name: string;
  language: string;
  currency: Currency;
  symbol: string;
  flag: string;
}

export const countries: CountryInfo[] = [
  {
    code: 'GB',
    name: 'Great Britain',
    language: 'EN',
    currency: 'GBP',
    symbol: '£',
    flag: '🇬🇧'
  },
  {
    code: 'NO',
    name: 'Norway',
    language: 'NO',
    currency: 'NOK',
    symbol: 'kr',
    flag: '🇳🇴'
  },
  {
    code: 'US',
    name: 'United States',
    language: 'US',
    currency: 'USD',
    symbol: '$',
    flag: '🇺🇸'
  },
  {
    code: 'DK',
    name: 'Denmark',
    language: 'DA',
    currency: 'DKK',
    symbol: 'kr',
    flag: '🇩🇰'
  },
  {
    code: 'SE',
    name: 'Sweden',
    language: 'SV',
    currency: 'SEK',
    symbol: 'kr',
    flag: '🇸🇪'
  }
];

interface LanguageContextType {
  selectedCountry: CountryInfo;
  setSelectedCountry: (country: CountryInfo) => void;
  formatPrice: (prices: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialCountry(): CountryInfo {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/geo-country=(\w+)/);
    if (match) {
      const found = countries.find(c => c.code === match[1]);
      if (found) return found;
    }
  }
  return countries[0];
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCountry, setSelectedCountryState] = useState<CountryInfo>(getInitialCountry);

  const setSelectedCountry = (country: CountryInfo) => {
    setSelectedCountryState(country);
    document.cookie = `geo-country=${country.code};path=/;max-age=${60 * 60 * 24 * 365}`;
  };

  const formatPrice = (prices: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number }) => {
    const price = prices[selectedCountry.currency];
    if (selectedCountry.currency === 'NOK' || selectedCountry.currency === 'DKK' || selectedCountry.currency === 'SEK') {
      return `${price} ${selectedCountry.symbol}`;
    }
    return `${selectedCountry.symbol}${price}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        formatPrice,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 