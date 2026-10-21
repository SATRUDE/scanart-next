import { describe, it, expect } from 'vitest';
import {
  HANDLING_DAYS,
  OFFER_SHIPPING_DESTINATIONS,
  RETURN_POLICY_COUNTRIES,
  lowestPricedSize,
  offerShippingDetails,
  productReturnPolicy,
} from './offer-structured-data';

// Google's merchant-listing rules for these two objects
// (developers.google.com/search/docs/appearance/structured-data/merchant-listing,
// read 21 Oct 2026). The Rich Results Test needs a browser and a deployed
// page, so the rules are checked here against what the pages emit (T-0158).
type Ld = Record<string, unknown>;

function validateReturnPolicy(p: Ld): string[] {
  const errors: string[] = [];
  if (p['@type'] !== 'MerchantReturnPolicy') errors.push('@type');
  const countries = p.applicableCountry as string[];
  if (!Array.isArray(countries) || !countries.length || countries.length > 50) errors.push('applicableCountry: 1 to 50');
  if (countries?.some(c => !/^[A-Z]{2}$/.test(c))) errors.push('applicableCountry: ISO alpha-2');
  const category = p.returnPolicyCategory as string;
  if (!['MerchantReturnFiniteReturnWindow', 'MerchantReturnNotPermitted', 'MerchantReturnUnlimitedWindow'].map(v => `https://schema.org/${v}`).includes(category)) errors.push('returnPolicyCategory');
  if (category?.endsWith('FiniteReturnWindow') && !(Number.isInteger(p.merchantReturnDays) && (p.merchantReturnDays as number) > 0)) errors.push('merchantReturnDays');
  if (!['ReturnAtKiosk', 'ReturnByMail', 'ReturnInStore'].map(v => `https://schema.org/${v}`).includes(p.returnMethod as string)) errors.push('returnMethod');
  const fees = p.returnFees as string;
  if (!['FreeReturn', 'ReturnFeesCustomerResponsibility', 'ReturnShippingFees'].map(v => `https://schema.org/${v}`).includes(fees)) errors.push('returnFees');
  if (fees?.endsWith('ReturnShippingFees') && !p.returnShippingFeesAmount) errors.push('returnShippingFeesAmount');
  return errors;
}

function validateShippingDetails(d: Ld): string[] {
  const errors: string[] = [];
  if (d['@type'] !== 'OfferShippingDetails') errors.push('@type');
  const rate = d.shippingRate as Ld;
  if (rate?.['@type'] !== 'MonetaryAmount') errors.push('shippingRate @type');
  if (typeof rate?.value !== 'number' || (rate.value as number) < 0) errors.push('shippingRate.value');
  if (!/^[A-Z]{3}$/.test(String(rate?.currency))) errors.push('shippingRate.currency');
  const dest = d.shippingDestination as Ld;
  if (dest?.['@type'] !== 'DefinedRegion' || !/^[A-Z]{2}$/.test(String(dest.addressCountry))) errors.push('shippingDestination');
  const time = d.deliveryTime as Ld;
  if (time?.['@type'] !== 'ShippingDeliveryTime') errors.push('deliveryTime');
  for (const key of ['handlingTime', 'transitTime']) {
    const q = time?.[key] as Ld;
    const ok =
      q?.['@type'] === 'QuantitativeValue' &&
      Number.isInteger(q.minValue) && Number.isInteger(q.maxValue) &&
      (q.minValue as number) >= 0 && (q.maxValue as number) >= (q.minValue as number) &&
      (q.unitCode === 'DAY' || q.unitCode === 'd');
    if (!ok) errors.push(key);
  }
  return errors;
}

const RATES = { GB: 5.99, NO: 6.5, SE: 7.5, DK: 7, US: 6.5 };

describe('product return policy (T-0158)', () => {
  it('passes Google’s merchant-listing rules, returnMethod included', () => {
    expect(validateReturnPolicy(productReturnPolicy())).toEqual([]);
  });

  it('says what the Delivery & Returns page says: 14 days, nothing to pay', () => {
    const p = productReturnPolicy();
    expect(p.merchantReturnDays).toBe(14);
    expect(p.returnFees).toBe('https://schema.org/FreeReturn');
    expect(p.returnMethod).toBe('https://schema.org/ReturnByMail');
  });

  it('covers the UK, Norway, the US and every EU state, within Google’s 50', () => {
    expect(RETURN_POLICY_COUNTRIES).toEqual(expect.arrayContaining(['GB', 'NO', 'US', 'SE', 'DK', 'DE', 'FR']));
    expect(RETURN_POLICY_COUNTRIES).toHaveLength(30);
  });
});

describe('offer shipping details (T-0158)', () => {
  it('passes Google’s merchant-listing rules for every destination', () => {
    const details = offerShippingDetails(45, RATES);
    expect(details).toHaveLength(OFFER_SHIPPING_DESTINATIONS.length);
    for (const d of details) expect(validateShippingDetails(d)).toEqual([]);
  });

  it('charges the real rate for one unframed print under the threshold', () => {
    const details = offerShippingDetails(45, RATES);
    const gb = details.find(d => d.shippingDestination.addressCountry === 'GB');
    expect(gb?.shippingRate).toEqual({ '@type': 'MonetaryAmount', value: 5.99, currency: 'GBP' });
    expect(gb?.deliveryTime.handlingTime).toMatchObject({ minValue: HANDLING_DAYS[0], maxValue: HANDLING_DAYS[1] });
    expect(gb?.deliveryTime.transitTime).toMatchObject({ minValue: 2, maxValue: 3 });
  });

  it('ships free when the unframed print alone reaches GBP 100, exactly 100 included', () => {
    for (const price of [100, 140]) {
      for (const d of offerShippingDetails(price, RATES)) expect(d.shippingRate.value).toBe(0);
    }
    for (const d of offerShippingDetails(99.99, RATES)) expect(d.shippingRate.value).toBeGreaterThan(0);
  });

  it('leaves out a destination with no rate rather than calling it free', () => {
    const details = offerShippingDetails(45, { GB: 5.99, NO: 0 });
    expect(details.map(d => d.shippingDestination.addressCountry)).toEqual(['GB']);
  });
});

describe('lowestPricedSize', () => {
  it('picks the size whose GBP price is the Offer price', () => {
    const p = { GBP: 0, NOK: 0, USD: 0, DKK: 0, SEK: 0 };
    expect(lowestPricedSize({ prices: { '50x70': { ...p, GBP: 79 }, '30x40': { ...p, GBP: 45 }, '70x100': { ...p, GBP: 119 } } })).toBe('30x40');
    expect(lowestPricedSize({ prices: null })).toBeUndefined();
  });
});
