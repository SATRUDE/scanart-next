import { describe, it, expect } from 'vitest';
import {
  DESTINATIONS,
  defaultDestination,
  destinationName,
  getAddressFormat,
  type ShippingCountry,
} from './address';
import { getShippingRate } from '@/config/shipping';
import { countries } from '@/contexts/LanguageContext';

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
  it('offers every country the shipping table prices', () => {
    for (const country of countries) {
      expect(DESTINATIONS.some(d => d.code === country.code)).toBe(true);
    }
  });

  it('offers somewhere else, because the site promises worldwide delivery', () => {
    expect(DESTINATIONS.some(d => d.code === 'ELSEWHERE')).toBe(true);
  });

  // A destination with no rate would silently ship for nothing.
  it('has a real shipping rate behind every option', () => {
    for (const destination of DESTINATIONS) {
      const rate = getShippingRate(destination.code);
      expect(rate, `no shipping rate for ${destination.code}`).toBeDefined();
      expect(rate!.costs.GBP).toBeGreaterThan(0);
    }
  });

  it('has no duplicate codes', () => {
    const codes = DESTINATIONS.map(d => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('destinationName', () => {
  it('gives the name a human would recognise, for the order record', () => {
    expect(destinationName('NO')).toBe('Norway');
    expect(destinationName('GB')).toBe('Great Britain');
  });

  it('names the fallback rather than showing a code', () => {
    expect(destinationName('ELSEWHERE')).toBe('Somewhere else');
    expect(destinationName('XX' as ShippingCountry)).toBe('Somewhere else');
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
    for (const country of countries) {
      if (country.code !== 'US') expect(defaultDestination(country.code)).not.toBe('US');
    }
  });
});
