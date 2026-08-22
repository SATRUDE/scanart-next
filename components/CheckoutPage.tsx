'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Truck, Shield, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CheckoutStrings } from '@/lib/i18n';
import { SmartImage } from '@/components/SmartImage';
import { getProductPrice } from '@/lib/pricing';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '@/config/stripe';
import { OrderComplete } from '@/components/OrderComplete';
import { getShippingRate } from '@/config/shipping';
import {
  DESTINATIONS,
  defaultDestination,
  destinationName,
  getAddressFormat,
  shippingZoneFor,
} from '@/lib/address';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { getFrameName, getFramePrice } from '@/config/frame';
import { track } from '@/lib/analytics';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// At module scope because the React compiler (rightly) refuses impure calls
// in anything it might memoise: a Date.now() inside the component would give
// a cached handler a stale clock. Out here it runs when the order does.
function orderReference(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

// Stripe Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Payment Form Component
const EN: CheckoutStrings = {
  heading: 'Checkout',
  subheading: 'Complete your purchase below',
  cartEmpty: 'Your cart is empty',
  continueShopping: 'Continue Shopping',
  email: 'Email',
  firstName: 'First Name',
  lastName: 'Last Name',
  address: 'Address',
  country: 'Country',
  city: 'City',
  searchCountry: 'Search for your country',
  noCountry: 'No country by that name.',
  cardDetails: 'Card Details',
  processing: 'Processing...',
  payPrefix: 'Pay',
  orderSummary: 'Order Summary',
  discountPlaceholder: 'Discount code',
  apply: 'Apply',
  percentOff: 'off applied',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  free: 'Free',
  discount: 'Discount',
  total: 'Total',
  secureHeading: 'Secure Checkout',
  secureBody: 'Your payment information is encrypted and secure. We never store your credit card details.',
  shipsMostHeading: 'Where we ship most',
  elsewhereHeading: 'Everywhere else',
  payNotice: 'Purchasing can take up to a minute to process. Please do not refresh.',
  invalidCode: 'Invalid discount code',
  couldNotCheckCode: 'Could not check the code, please try again',
  orderTotalChanged: 'Order total changed, please refresh and try again',
  paymentFailed: 'Payment failed',
};

const PaymentForm: React.FC<{
  total: number;
  currency: string;
  t: CheckoutStrings;
  orderItems: { productId: string; size?: string; frame?: string; quantity: number }[];
  countryCode: string;
  discountCode?: string;
  // Recorded onto the PaymentIntent so a completed order is fulfillable from
  // Stripe alone, without depending on this browser reaching us afterwards.
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ total, currency, t, orderItems, countryCode, discountCode, customer, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('PaymentForm rendered:', { stripe: !!stripe, elements: !!elements, publishableKey });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    track('pay', {
      total,
      currency,
    });

    setIsProcessing(true);
    setError(null);

    try {
      // The server recomputes the charge from the catalogue; the client sends
      // what is being bought, never what it costs (lib/server/order.ts).
      const response = await fetch(`/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          currency: currency.toLowerCase(),
          countryCode,
          discountCode,
          customer,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.clientSecret) {
        throw new Error(responseData.error || 'No client secret received from server');
      }

      // The displayed total and the server's computed charge must agree; a
      // mismatch means stale prices or a tampered cart, either way stop.
      if (typeof responseData.amount === 'number' && Math.abs(responseData.amount - total) > 0.01) {
        track('checkout-error', { code: 'amount-mismatch', total, currency });
        throw new Error(t.orderTotalChanged);
      }

      const { clientSecret } = responseData;

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (paymentError) {
        track('checkout-error', { code: paymentError.code || 'unknown', total, currency });
        setError(paymentError.message || t.paymentFailed);
        onError(paymentError.message || t.paymentFailed);
      } else {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.paymentFailed;
      track('checkout-error', { code: 'exception', total, currency });
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="card-element">{t.cardDetails}</Label>
          <div className="mt-1 p-3 border border-gray-300 rounded-md">
            {stripe && elements ? (
              <CardElement
                id="card-element"
                options={cardElementOptions}
              />
            ) : (
              <div className="text-red-600 text-sm">
                Loading payment form...
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={!stripe || isProcessing}
          data-primary-cta="pay"
        >
          {isProcessing ? t.processing : `${t.payPrefix} ${currency.toUpperCase()} ${total.toFixed(2)}`}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-2">{t.payNotice}</p>
      </div>
    </form>
  );
};

/**
 * Country picker for the shipping address.
 *
 * A searchable list rather than a dropdown, because there are 267 countries
 * and scrolling to Slovenia is not a checkout experience. The five with their
 * own shipping rate sit at the top, since they are most of our buyers; the
 * rest follow alphabetically and are found by typing.
 */
const CountryPicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  t: CheckoutStrings;
}> = ({ value, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const priced = DESTINATIONS.filter(d => d.priced);
  const rest = DESTINATIONS.filter(d => !d.priced);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="country"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {destinationName(value)}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t.searchCountry} />
          <CommandList>
            <CommandEmpty>{t.noCountry}</CommandEmpty>
            <CommandGroup heading={t.shipsMostHeading}>
              {priced.map(destination => (
                <CountryOptionRow
                  key={destination.code}
                  destination={destination}
                  selected={value === destination.code}
                  onSelect={() => {
                    onChange(destination.code);
                    setOpen(false);
                  }}
                />
              ))}
            </CommandGroup>
            <CommandGroup heading={t.elsewhereHeading}>
              {rest.map(destination => (
                <CountryOptionRow
                  key={destination.code}
                  destination={destination}
                  selected={value === destination.code}
                  onSelect={() => {
                    onChange(destination.code);
                    setOpen(false);
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const CountryOptionRow: React.FC<{
  destination: { code: string; name: string };
  selected: boolean;
  onSelect: () => void;
}> = ({ destination, selected, onSelect }) => (
  <CommandItem
    // Searching by name AND code, so "DE" finds Germany as readily as typing it.
    value={`${destination.name} ${destination.code}`}
    onSelect={onSelect}
  >
    <Check className={`mr-2 h-4 w-4 ${selected ? 'opacity-100' : 'opacity-0'}`} />
    {destination.name}
  </CommandItem>
);

// Main Checkout Component
// Discount codes are validated server-side (/api/validate-discount); this
// public repository must never contain a working code.

export const CheckoutPage: React.FC<{ strings?: CheckoutStrings }> = ({ strings }) => {
  const t = strings ?? EN;
  const router = useRouter();
  const onBack = () => router.push('/products');
  const { state, getTotalPriceInCurrency, clearCart } = useCart();
  const { formatPrice, selectedCountry } = useLanguage();
  const [orderComplete, setOrderComplete] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number; description: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Debug log to verify component is loaded

  // `country` holds a destination CODE, not a display name: the name is for
  // showing, the code is what prices the delivery. It starts wherever the
  // buyer is already browsing, so their first act on this form is not to
  // correct us about which country they live in.
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: defaultDestination(selectedCountry.code),
  });

  const handleInputChange = (field: string, value: string) => {
    if (field === 'country') {
      const destination = value;
      // The event keeps carrying the readable name, so this stays comparable
      // with every shipping-country-selected recorded before the field held a
      // code rather than a name.
      track('shipping-country-selected', { country: destinationName(destination) });
      // Somewhere with no region must not inherit the last one's: a stale
      // "CA" would otherwise ride along on a Norwegian address, invisibly,
      // because the field it came from is no longer on screen.
      const keepRegion = getAddressFormat(destination).hasRegion;
      setFormData(prev => ({ ...prev, country: destination, state: keepRegion ? prev.state : '' }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyDiscount = async () => {
    const code = discountCode.toUpperCase().trim();
    if (!code) return;
    try {
      const response = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (result.valid) {
        setAppliedDiscount({ code: result.code, percentage: result.percentage, description: result.description });
        setDiscountError(null);
        setDiscountCode('');
      } else {
        setDiscountError(t.invalidCode);
        setAppliedDiscount(null);
      }
    } catch {
      setDiscountError(t.couldNotCheckCode);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError(null);
  };

  const handlePaymentSuccess = async () => {
    try {
      // Prepare order data for Slack notification
      const orderData = {
        orderId: orderReference('ORD'),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: destinationName(formData.country),
        },
        items: state.items.map(item => ({
          name: item.product.name,
          size: item.size,
          frame: item.frame && item.frame !== 'no-frame' ? getFrameName(item.frame) : null,
          quantity: item.quantity,
          price: formatPrice({ 
            GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', item.size, 'GBP')) * item.quantity) * 100) / 100, 
            NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', item.size, 'NOK')) * item.quantity) * 100) / 100, 
            USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', item.size, 'USD')) * item.quantity) * 100) / 100, 
            DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', item.size, 'DKK')) * item.quantity) * 100) / 100, 
            SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', item.size, 'SEK')) * item.quantity) * 100) / 100 
          }),
        })),
        total: formatPrice({ 
          GBP: total, 
          NOK: total * 13.75, 
          USD: total * 1.29, 
          DKK: total * 8.75, 
          SEK: total * 13.75 
        }),
        currency: selectedCountry.currency,
        discountCode: appliedDiscount?.code || null,
      };

      // Send order data to server for Slack notification
      await fetch(`/api/order-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      console.log("✅ Order data sent to server for Slack notification");
    } catch (error) {
      console.error("❌ Error sending order data to server:", error);
      // Don't block the order completion if Slack notification fails
    }

    setOrderComplete(true);
    // Scroll to top of page for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearCart();
  };

  // The form shows its own error beside the card field, which is where the
  // buyer is looking; this page-level copy was stored and never rendered.
  const handlePaymentError = () => {};

  // Add test mode function
  const handleTestMode = async () => {
    try {
      // Prepare order data for Slack notification
      const orderData = {
        orderId: orderReference('TEST'),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: destinationName(formData.country),
        },
        items: state.items.map(item => ({
          name: item.product.name,
          size: item.size,
          frame: item.frame && item.frame !== 'no-frame' ? getFrameName(item.frame) : null,
          quantity: item.quantity,
          price: formatPrice({ 
            GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', item.size, 'GBP')) * item.quantity) * 100) / 100, 
            NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', item.size, 'NOK')) * item.quantity) * 100) / 100, 
            USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', item.size, 'USD')) * item.quantity) * 100) / 100, 
            DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', item.size, 'DKK')) * item.quantity) * 100) / 100, 
            SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', item.size, 'SEK')) * item.quantity) * 100) / 100 
          }),
        })),
        total: formatPrice({ 
          GBP: total, 
          NOK: total * 13.75, 
          USD: total * 1.29, 
          DKK: total * 8.75, 
          SEK: total * 13.75 
        }),
        currency: selectedCountry.currency,
        discountCode: appliedDiscount?.code || null,
      };

      // Send order data to server for Slack notification
      await fetch(`/api/order-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      console.log("✅ Test order data sent to server for Slack notification");
    } catch (error) {
      console.error("❌ Error sending test order data to server:", error);
      // Don't block the order completion if Slack notification fails
    }

    try {
      // Prepare order data for Slack notification
      const orderData = {
        orderId: orderReference('ORD'),
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: destinationName(formData.country),
        },
        items: state.items.map(item => ({
          name: item.product.name,
          size: item.size,
          frame: item.frame && item.frame !== 'no-frame' ? getFrameName(item.frame) : null,
          quantity: item.quantity,
          price: formatPrice({ 
            GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', item.size, 'GBP')) * item.quantity) * 100) / 100, 
            NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', item.size, 'NOK')) * item.quantity) * 100) / 100, 
            USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', item.size, 'USD')) * item.quantity) * 100) / 100, 
            DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', item.size, 'DKK')) * item.quantity) * 100) / 100, 
            SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', item.size, 'SEK')) * item.quantity) * 100) / 100 
          }),
        })),
        total: formatPrice({ 
          GBP: total, 
          NOK: total * 13.75, 
          USD: total * 1.29, 
          DKK: total * 8.75, 
          SEK: total * 13.75 
        }),
        currency: selectedCountry.currency,
        discountCode: appliedDiscount?.code || null,
      };

      // Send order data to server for Slack notification
      await fetch(`/api/order-complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      console.log("✅ Order data sent to server for Slack notification");
    } catch (error) {
      console.error("❌ Error sending order data to server:", error);
      // Don't block the order completion if Slack notification fails
    }

    setOrderComplete(true);
    // Scroll to top of page for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearCart();
  };

  if (state.items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">{t.cartEmpty}</h2>
          <Button onClick={onBack}>{t.continueShopping}</Button>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return <OrderComplete onContinueShopping={onBack} />;
  }

  const subtotal = getTotalPriceInCurrency(selectedCountry.currency);
  
  // The form holds the real country code; the RATE is looked up by zone. Both
  // sides must agree: the server prices the same way, and if the displayed
  // total and the server's charge disagree the payment is refused, so getting
  // this wrong would block every rest-of-world order rather than mispricing it.
  const selectedCountryCode = formData.country;
  const shippingRate = getShippingRate(shippingZoneFor(selectedCountryCode));
  // How this destination writes an address: what the postal code is called,
  // and whether a region is a real thing there at all.
  const addressFormat = getAddressFormat(selectedCountryCode);
  
    // Get shipping cost in user's selected currency
  const shipping: number = shippingRate ? shippingRate.costs[selectedCountry.currency] || 0 : 0;
  
  // Calculate discount
  const discountAmount = appliedDiscount 
    ? Math.round((subtotal * appliedDiscount.percentage / 100) * 100) / 100 
    : 0;
  
  const finalTax = 0; // No tax for any orders
  const finalShipping = shipping;
  
  const total = Math.round((subtotal + finalShipping + finalTax - discountAmount) * 100) / 100; // Round to 2 decimal places

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6 order-2 lg:order-1">
            <div>
              <h1 className="text-3xl tracking-tight mb-2">{t.heading}</h1>
              <p className="text-muted-foreground">{t.subheading}</p>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t.firstName}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t.lastName}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t.address}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{t.country}</Label>
                    <CountryPicker
                      t={t}
                      value={formData.country}
                      onChange={value => handleInputChange('country', value)}
                    />
                  </div>
                  {/* Country sits above these because it decides what they
                      are called and whether a region exists at all. */}
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      addressFormat.hasRegion ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                    }`}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="city">{t.city}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    {addressFormat.hasRegion && (
                      <div className="space-y-2">
                        <Label htmlFor="state">{addressFormat.regionLabel}</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{addressFormat.postalLabel}</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder={addressFormat.postalExample}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Payment form - always shown */}
                  {publishableKey ? (
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        total={total}
                        currency={selectedCountry.currency}
                        orderItems={state.items.map(item => ({
                          productId: item.product.id,
                          size: item.size,
                          frame: item.frame,
                          quantity: item.quantity,
                        }))}
                        countryCode={selectedCountryCode}
                        t={t}
                        customer={{
                          email: formData.email,
                          firstName: formData.firstName,
                          lastName: formData.lastName,
                          address: formData.address,
                          city: formData.city,
                          state: formData.state,
                          zipCode: formData.zipCode,
                        }}
                        discountCode={appliedDiscount?.code}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  ) : (
                    // Stripe failed to load
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-800">
                              Payment System Unavailable
                            </p>
                            <p className="text-xs text-red-600">
                              Stripe payment system failed to load. Please check your configuration.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestMode}
                        className="w-full"
                      >
                        🧪 Test Mode - Skip Payment
                      </Button>
                    </div>
                  )}
                  
                  {/* Test Mode Button - Only show in development */}
                  {process.env.NODE_ENV === 'development' && publishableKey && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleTestMode}
                        className="w-full text-sm"
                      >
                        🧪 Test Mode - Skip Payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6 order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.orderSummary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.items.map((item) => (
                  <div key={`${item.product.id}-${item.size || 'no-size'}-${item.frame || 'no-frame'}`} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      {/* 64px box (h-16 w-16): without this hint SmartImage's
                          '100vw' default makes the browser pick a full-viewport
                          variant to fill a thumbnail. */}
                      <SmartImage
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-sm">{item.product.name}</h4>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">
                          Size: {item.size}
                        </p>
                      )}
                      {item.frame && item.frame !== 'no-frame' && (
                        <p className="text-xs text-muted-foreground">
                          Frame: {getFrameName(item.frame)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm">{formatPrice({ 
                        GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', item.size, 'GBP')) * item.quantity) * 100) / 100, 
                        NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', item.size, 'NOK')) * item.quantity) * 100) / 100, 
                        USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', item.size, 'USD')) * item.quantity) * 100) / 100, 
                        DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', item.size, 'DKK')) * item.quantity) * 100) / 100, 
                        SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', item.size, 'SEK')) * item.quantity) * 100) / 100 
                      })}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Discount Code Section */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.discountPlaceholder}
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleApplyDiscount}
                      disabled={!discountCode.trim()}
                    >
                      {t.apply}
                    </Button>
                  </div>
                  
                  {discountError && (
                    <p className="text-sm text-red-600">{discountError}</p>
                  )}
                  
                  {appliedDiscount && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {appliedDiscount.code} - {appliedDiscount.description}
                        </p>
                        <p className="text-xs text-green-600">
                          {appliedDiscount.percentage}% off applied
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={handleRemoveDiscount}
                        className="text-green-600 hover:text-green-800"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t.subtotal}</span>
                    <span>{formatPrice({ GBP: subtotal, NOK: subtotal, USD: subtotal, DKK: subtotal, SEK: subtotal })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t.shipping}</span>
                    <span>{finalShipping === 0 ? t.free : formatPrice({ 
                      GBP: selectedCountry.currency === 'GBP' ? finalShipping : 0,
                      NOK: selectedCountry.currency === 'NOK' ? finalShipping : 0,
                      USD: selectedCountry.currency === 'USD' ? finalShipping : 0,
                      DKK: selectedCountry.currency === 'DKK' ? finalShipping : 0,
                      SEK: selectedCountry.currency === 'SEK' ? finalShipping : 0
                    })}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t.discount} ({appliedDiscount.percentage}%)</span>
                      <span>-{formatPrice({ GBP: discountAmount, NOK: discountAmount, USD: discountAmount, DKK: discountAmount, SEK: discountAmount })}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span>{t.total}</span>
                    <span>{formatPrice({ GBP: total, NOK: total, USD: total, DKK: total, SEK: total })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 mt-0.5 text-green-600" />
                  <div>
                    <h4 className="text-sm mb-1">{t.secureHeading}</h4>
                    <p className="text-xs text-muted-foreground">{t.secureBody}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};