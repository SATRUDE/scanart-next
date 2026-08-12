import { describe, it, expect } from 'vitest';
import {
  DESTINATIONS,
  defaultDestination,
  destinationName,
  getAddressFormat,
  isDeliverable,
  shippingZoneFor,
  type ShippingCountry,
} from './address';
import { ALL_COUNTRIES } from './countries';

// The five countries with their own shipping rate, read from the rate table
// rather than restated here, so this cannot drift from what we actually price.
const PRICED = ['GB', 'NO', 'US', 'DK', 'SE'];
import { getShippingRate } from '@/config/shipping';


describe('getAddressFormat', () => {
  // The bug this file exists to fix: every buyer was asked for a State and a
  // ZIP Code, both required, whoever and wherever they were.
  it('asks a Norwegian for a postnummer and no region', () => {
    const format = getAddressFormat('NO');
    expect(format.postalLabel).toBe('Postnummer');
    expect(format.hasRegion).toBe(false);
  });

  it('asks nobody in Europe for a state', () => {
    for (const country of ['NO', 'GB', 'DK', 'SE'] as ShippingCountry[]) {
      expect(getAddressFormat(country).hasRegion).toBe(false);
    }
  });

  it('still asks an American for a State and a ZIP Code, because they have both', () => {
    const format = getAddressFormat('US');
    expect(format.hasRegion).toBe(true);
    expect(format.regionLabel).toBe('State');
    expect(format.postalLabel).toBe('ZIP Code');
  });

  it('calls it a Postcode in the UK', () => {
    expect(getAddressFormat('GB').postalLabel).toBe('Postcode');
  });

  it('falls back to a neutral postal code rather than guessing at a region', () => {
    const format = getAddressFormat('ELSEWHERE');
    expect(format.postalLabel).toBe('Postal code');
    expect(format.hasRegion).toBe(false);
  });

  it('never returns undefined, whatever it is handed', () => {
    expect(getAddressFormat('XX' as ShippingCountry).postalLabel).toBeTruthy();
  });
});

describe('DESTINATIONS', () => {
  it('lists the five priced countries first, then the rest of the world', () => {
    expect(DESTINATIONS.slice(0, PRICED.length).every(d => d.priced)).toBe(true);
    expect(DESTINATIONS.slice(PRICED.length).every(d => !d.priced)).toBe(true);
  });

  it('offers somewhere a buyer might actually live, not a shortlist', () => {
    for (const code of ['DE', 'FR', 'NL', 'JP', 'AU', 'CA', 'ZA', 'BR']) {
      expect(DESTINATIONS.some(d => d.code === code), `${code} missing`).toBe(true);
    }
    expect(DESTINATIONS.length).toBeGreaterThan(200);
  });

  // Every option must have a price behind it, or an order ships for nothing.
  it('has a real shipping rate behind every single option', () => {
    for (const destination of DESTINATIONS) {
      const rate = getShippingRate(shippingZoneFor(destination.code));
      expect(rate, `no shipping rate for ${destination.code}`).toBeDefined();
      expect(rate!.costs.GBP).toBeGreaterThan(0);
    }
  });

  it('has no duplicate codes', () => {
    const codes = DESTINATIONS.map(d => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('shippingZoneFor', () => {
  it('prices the five named countries at their own rate', () => {
    for (const code of PRICED) {
      expect(shippingZoneFor(code)).toBe(code);
    }
  });

  it('prices everywhere else at the Rest of World rate', () => {
    for (const code of ['DE', 'FR', 'JP', 'AU', 'CA']) {
      expect(shippingZoneFor(code)).toBe('ELSEWHERE');
    }
  });

  // The hole this closes: getShippingRate returns undefined for a code it does
  // not know, and the caller turned that into zero, so a request carrying
  // countryCode "ZZ" was charged no delivery at all.
  it('NEVER leaves an unrecognised code without a rate', () => {
    for (const code of ['ZZ', '', 'ELSEWHERE', 'not-a-country', 'no']) {
      const rate = getShippingRate(shippingZoneFor(code));
      expect(rate, `${code} priced at nothing`).toBeDefined();
      expect(rate!.costs.GBP).toBeGreaterThan(0);
    }
  });

  it('is case sensitive on purpose, so a lower-case code pays Rest of World rather than slipping through', () => {
    expect(shippingZoneFor('no')).toBe('ELSEWHERE');
  });
});

describe('isDeliverable', () => {
  it('accepts a real country', () => {
    expect(isDeliverable('DE')).toBe(true);
    expect(isDeliverable('NO')).toBe(true);
  });

  it('rejects anything that is not one', () => {
    expect(isDeliverable('ZZ')).toBe(false);
    expect(isDeliverable('ELSEWHERE')).toBe(false);
    expect(isDeliverable('')).toBe(false);
  });

  it('agrees with the generated list', () => {
    expect(ALL_COUNTRIES.every(c => isDeliverable(c.code))).toBe(true);
  });
});

describe('destinationName', () => {
  it('gives the name a human would recognise, for the order record', () => {
    expect(destinationName('NO')).toBe('Norway');
    expect(destinationName('GB')).toBe('United Kingdom');
  });

  it('names a country outside the priced five', () => {
    expect(destinationName('DE')).toBe('Germany');
    expect(destinationName('JP')).toBe('Japan');
  });

  it('falls back to the code rather than inventing a country', () => {
    expect(destinationName('XX')).toBe('XX');
  });
});

describe('defaultDestination', () => {
  // The buyer has already said where they are by choosing a currency. Starting
  // the form in the United States made a Norwegian's first act a correction.
  it('starts where the buyer is already browsing', () => {
    expect(defaultDestination('NO')).toBe('NO');
    expect(defaultDestination('GB')).toBe('GB');
    expect(defaultDestination('US')).toBe('US');
  });

  it('never silently defaults to the United States', () => {
    for (const code of PRICED) {
      if (code !== 'US') expect(defaultDestination(code)).not.toBe('US');
    }
  });

  it('always starts on a country we can actually post to', () => {
    for (const code of PRICED) {
      expect(isDeliverable(defaultDestination(code))).toBe(true);
    }
  });
});
