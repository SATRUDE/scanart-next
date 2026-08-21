'use client';

import React, { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { formatDisplayPrice } from '@/lib/pricing';

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

const COOKIE = 'geo-country';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The country the `geo-country` cookie names, or Great Britain when there is
 * no cookie, no match, or no document.
 *
 * Returns a member of the `countries` array rather than a fresh object, so
 * repeated calls give a stable reference. useSyncExternalStore compares
 * snapshots by identity and would loop for ever on a new object each read.
 */
function readCookieCountry(): CountryInfo {
  if (typeof document === 'undefined') return countries[0];
  const match = document.cookie.match(new RegExp(`${COOKIE}=(\\w+)`));
  if (!match) return countries[0];
  return countries.find(c => c.code === match[1]) ?? countries[0];
}

/** Subscribers, so a write in one component reaches every reader. */
const listeners = new Set<() => void>();
function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Great Britain during SSR and hydration, on purpose. See the provider. */
function getServerSnapshot(): CountryInfo {
  return countries[0];
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  /**
   * THE COOKIE IS THE SINGLE SOURCE OF TRUTH, read through
   * useSyncExternalStore rather than mirrored into useState.
   *
   * What was here before read the cookie inside a `useState` initialiser,
   * guarded by `typeof document !== 'undefined'`. That is the first item on
   * React's own hydration-mismatch list and it behaved exactly as advertised:
   * the server has no `document` so it rendered Great Britain and EN, while a
   * Norwegian visitor's client read `geo-country=NO` and rendered Norway and
   * NO. Server and client disagreed on every page load outside Great Britain,
   * so React threw and regenerated the tree. It survived this long because a
   * British visitor sees both sides agree, and the visible symptom was the
   * language picker in the header showing EN then NO.
   *
   * Why this API rather than reading the cookie in an effect: an effect that
   * calls setState synchronously is a cascading render, which the repo's lint
   * rule rejects, and it would have left TWO sources of truth that can drift.
   * useSyncExternalStore is built for precisely this shape, a value that has a
   * different server snapshot from its client snapshot, and it collapses the
   * state and the cookie into one thing.
   *
   * WHAT THIS DOES NOT FIX, and its ticket stays open at High. A Norwegian is
   * still served pounds in the HTML and still watches them become kroner: that
   * flash is now correct behaviour rather than an error, which is not the same
   * as being gone. And the product JSON-LD still ships priceCurrency GBP to
   * everyone, which matters more, because Googlebot crawls mostly from US IPs
   * so GBP is what gets indexed for every market. Verified on production
   * across four cookie states on 2026-08-21.
   *
   * Fixing those means either reading the cookie server-side with `cookies()`,
   * which opts the whole tree into dynamic rendering and undercuts the static
   * generation the site's search position leans on, or carrying currency in
   * the URL the way the /no tree already carries language, so each variant
   * stays statically generated and owns its own structured data. That is the
   * same decision as whether / should default a Norwegian visitor to
   * Norwegian: language, currency and the /no tree are one question wearing
   * three hats. THIS COMMIT IS A SILENCER, not the fix.
   */
  const selectedCountry = useSyncExternalStore(subscribe, readCookieCountry, getServerSnapshot);

  const setSelectedCountry = (country: CountryInfo) => {
    // Write the cookie, then tell every reader. No mirrored state to drift.
    document.cookie = `${COOKIE}=${country.code};path=/;max-age=${COOKIE_MAX_AGE}`;
    listeners.forEach(l => l());
  };

  // Delegates to the shared formatter so cards formatting outside this
  // context can never drift from it again (they did: "kr600" vs "600 kr").
  const formatPrice = (prices: { GBP: number; NOK: number; USD: number; DKK: number; SEK: number }) =>
    formatDisplayPrice(prices[selectedCountry.currency], selectedCountry.currency);

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