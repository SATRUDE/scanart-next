'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { CheckoutStrings } from '@/lib/i18n';
import { getProductPrice } from '@/lib/pricing';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '@/config/stripe';
import { OrderComplete, type CompletedOrder } from '@/components/OrderComplete';
import { saveCompletedOrder } from '@/lib/completed-order';
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
import { getFrameName, getFramePrice } from '@/config/frame';
import { track } from '@/lib/analytics';
import { COMPANY } from '@/config/company';
import { getArtistById } from '@/data/artists';
import { sizeLabel } from '@/components/PrintCard';
import { Button } from '@/components/v2/ui';
import {
  AssuranceLines,
  FormError,
  FormSection,
  OrderLine,
  OrderTotals,
  TextField,
  deliveryDays,
  fill,
} from '@/components/v2/checkout/parts';

/*
 * V2 checkout (Figma: Checkout · desktop 276:4235, Checkout · mobile 276:4391,
 * Checkout · desktop · payment failed 279:4438; Order confirmed 279:4648 /
 * 279:4761). This rebuild changes PRESENTATION ONLY. The payment flow is
 * line for line what it was: PaymentIntent creation on the server, the
 * CardElement, confirmCardPayment, the order-complete notification, discount
 * validation, the shipping rate and currency maths, the country picker and
 * address formats, analytics and error handling.
 *
 * The page stays noindex,follow with no canonical (app/(en)/checkout/page.tsx).
 */

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// At module scope because the React compiler (rightly) refuses impure calls
// in anything it might memoise: a Date.now() inside the component would give
// a cached handler a stale clock. Out here it runs when the order does.
function orderReference(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

// Stripe Card Element styling, matched to the Card field master (275:5721):
// Body type (18/30), ink text, placeholders at 45%, the error colour for an
// invalid card, and no box. The box and its 1 px bottom rule are drawn by
// the wrapper below, so the element itself sits on the page like a Text field.
// The iframe cannot see the page's self-hosted Hedvig face (next/font), so
// it names the family and falls back to the system sans.
const cardElementOptions = {
  // The delivery address already asks for the postcode; Stripe's own box made
  // buyers type it twice. It is passed to Stripe as billing_details instead.
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '18px',
      lineHeight: '30px',
      fontFamily: '"Hedvig Letters Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
      fontWeight: '400',
      color: '#000000',
      iconColor: '#000000',
      '::placeholder': {
        color: 'rgba(0, 0, 0, 0.45)',
      },
    },
    invalid: {
      color: '#c44039',
      iconColor: '#c44039',
    },
  },
};

// Payment Form Component
const EN: CheckoutStrings = {
  heading: 'Checkout',
  subheading: 'Complete your purchase below',
  cartEmpty: 'Your basket is empty',
  continueShopping: 'Continue shopping',
  email: 'Email',
  firstName: 'First name',
  lastName: 'Last name',
  address: 'Address',
  country: 'Country',
  city: 'City',
  searchCountry: 'Search for your country',
  noCountry: 'No country by that name.',
  cardDetails: 'Card details',
  processing: 'Processing',
  payPrefix: 'Pay',
  orderSummary: 'Order summary',
  discountPlaceholder: 'Discount code',
  apply: 'Apply',
  percentOff: 'off applied',
  subtotal: 'Subtotal',
  shipping: 'Delivery',
  free: 'Free',
  discount: 'Discount',
  total: 'Total',
  secureHeading: 'Secure checkout',
  secureBody: 'Your payment information is encrypted and secure. We never store your credit card details.',
  shipsMostHeading: 'Where we ship most',
  elsewhereHeading: 'Everywhere else',
  payNotice: 'It can take up to a minute. Please keep this page open.',
  invalidCode: 'Invalid discount code',
  couldNotCheckCode: 'Could not check the code, please try again',
  orderTotalChanged: 'Order total changed, please refresh and try again',
  paymentFailed: 'Payment failed',
  // Delivery facts from config/shipping.ts and app/(en)/delivery.
  v2: {
    contactTitle: 'Contact',
    contactNote: 'Stripe sends your receipt to this address.',
    deliveryTitle: 'Delivery address',
    paymentTitle: 'Payment',
    cardNote: 'Your card details go straight to Stripe. We never see or store them.',
    loadingCard: 'Loading the payment form …',
    codePlaceholder: 'Code',
    remove: 'Remove',
    yourOrder: 'Your order',
    showOrder: 'Show your order ({count})',
    hideOrder: 'Hide your order',
    printCount: '{n} prints',
    printCountOne: '1 print',
    quantity: 'Quantity {n}',
    deliveryNote: 'Delivered {from} to {to} business days after it is made',
    assuranceMade: 'Printed to order on 200gsm uncoated paper, made in 1 to 4 working days',
    assuranceReturns: '14 days to change your mind',
    assuranceStripe: 'Secure payment by Stripe',
    paymentFailedTitle: 'Your payment didn’t go through',
    paymentFailedHint: 'Nothing has been charged. Check the card details or try another card.',
    contactHelp: 'Still stuck? Email {email} and we will help.',
    unavailableTitle: 'Payment isn’t available right now',
    unavailableBody: 'The payment form from Stripe didn’t load. Please try again in a moment.',
    testMode: 'Test mode: skip payment',
    frameLabels: {
      'no-frame': 'no frame',
      wood: 'wood frame',
      black: 'black frame',
      white: 'white frame',
    },
    thanks: 'Thank you, {name}.',
    thanksNoName: 'Thank you.',
    placed: 'Your order is placed. Stripe has emailed your receipt to {email}.',
    nextHeading: 'What happens next',
    steps: {
      made: { title: 'Made to order', body: 'Your prints are printed on 200gsm uncoated paper, and framed if you chose a frame, in 1 to 4 working days.' },
      sent: { title: 'Sent to you', body: 'Delivery takes {from} to {to} business days once it is made.' },
      sentNoEstimate: 'Delivery time starts once it is sent, and depends on where it is going.',
      decide: { title: 'Fourteen days to decide', body: 'If it isn’t right on the wall, you have 14 days to change your mind.' },
    },
    keepBrowsing: 'Keep browsing prints',
    deliveringTo: 'Delivering to',
  },
};

/** The English labels, for the story and any caller without a dictionary. */
export const checkoutStringsEn = EN;

const PaymentForm: React.FC<{
  total: number;
  currency: string;
  /** The total as the page shows it (formatPrice), for the Pay button. */
  totalLabel: string;
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
  /** False until the server's price for this exact order has arrived (see useOrderQuote). */
  priced: boolean;
}> = ({ total, currency, totalLabel, t, orderItems, countryCode, discountCode, customer, onSuccess, onError, priced }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stripe's own live message for the card field (incomplete number, expired
  // date), shown under the field; the payment error goes in the Form error.
  const [cardError, setCardError] = useState<string | null>(null);

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
          // What the hidden postcode box used to collect, from the address form.
          billing_details: {
            name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || undefined,
            email: customer.email || undefined,
            address: {
              line1: customer.address || undefined,
              city: customer.city || undefined,
              state: customer.state || undefined,
              postal_code: customer.zipCode || undefined,
              country: countryCode || undefined,
            },
          },
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

  // id="checkout-form": the contact and address fields sit in their own
  // sections above and join this form through their `form` attribute, so
  // the browser checks every required field before handleSubmit runs.
  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-band">
      <div className="flex flex-col gap-group">
        {/* Card field 275:5721: the Stripe element styled as a Text field. */}
        <div className="flex flex-col gap-tight">
          <label htmlFor="card-element" className="type-small">{t.cardDetails}</label>
          <div className={`border-b pt-[6px] pb-[10px] ${cardError || error ? 'border-error' : 'border-ink'}`}>
            {stripe && elements ? (
              <CardElement
                id="card-element"
                options={cardElementOptions}
                onChange={e => setCardError(e.error?.message ?? null)}
              />
            ) : (
              <p className="type-body text-ink/45">{t.v2.loadingCard}</p>
            )}
          </div>
          {(cardError || error) && <p className="type-small text-error">{cardError ?? error}</p>}
        </div>
        <p className="type-small">{t.v2.cardNote}</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Form error 268:5258, fed by the real Stripe (or server) message. */}
        {error && (
          <div className="mb-4">
            <FormError
              title={t.v2.paymentFailedTitle}
              body={<>{error} {t.v2.paymentFailedHint}</>}
              contact={fill(t.v2.contactHelp, { email: COMPANY.email })}
            />
          </div>
        )}
        <Button
          type="submit"
          className="self-start"
          disabled={!stripe || isProcessing || !priced}
          data-primary-cta="pay"
          price={isProcessing ? undefined : totalLabel}
        >
          {isProcessing ? t.processing : t.payPrefix}
        </Button>

        <p className="type-small">{t.payNotice}</p>
      </div>
    </form>
  );
};

/**
 * Country picker for the shipping address (Select field 275:5669).
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
  locale: 'en' | 'no';
}> = ({ value, onChange, t, locale }) => {
  const [open, setOpen] = useState(false);
  // Names in the page's language; the long list re-sorted to match.
  const named = DESTINATIONS.map(d => ({ ...d, name: destinationName(d.code, locale) }));
  const priced = named.filter(d => d.priced);
  const rest = named.filter(d => !d.priced).sort((a, b) => a.name.localeCompare(b.name, locale === 'no' ? 'nb' : 'en'));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id="country"
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 border-b border-ink pt-[6px] pb-[10px] text-left type-body focus-visible:outline-none focus:border-b-2 focus:pb-[9px]"
        >
          {destinationName(value, locale)}
          <span aria-hidden className="type-small">⌄</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] rounded-none border-ink p-0 shadow-none" align="start">
        <Command className="rounded-none">
          <CommandInput placeholder={t.searchCountry} className="type-body" />
          <CommandList>
            <CommandEmpty className="py-4 text-center type-small">{t.noCountry}</CommandEmpty>
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
    className="rounded-none type-body"
  >
    <Check className={`mr-2 h-4 w-4 ${selected ? 'opacity-100' : 'opacity-0'}`} />
    {destination.name}
  </CommandItem>
);

const subscribeNever = () => () => {};

// Main Checkout Component
// Discount codes are validated server-side (/api/validate-discount); this
// public repository must never contain a working code.

export const CheckoutPage: React.FC<{ strings?: CheckoutStrings; locale?: 'en' | 'no' }> = ({ strings, locale = 'en' }) => {
  const t = strings ?? EN;
  const router = useRouter();
  const v = t.v2;
  // Locale-aware: "Continue shopping" on the Norwegian checkout used to go
  // to the English catalogue (router.push('/products')).
  const productsHref = locale === 'no' ? '/no/products' : '/products';
  const { state, getTotalPriceInCurrency, clearCart } = useCart();
  const { formatPrice, selectedCountry } = useLanguage();
  const [orderComplete, setOrderComplete] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number; description: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  // Presentation only: the mobile "Show your order" bar, and the order as it
  // was at the moment of payment, kept for the confirmation after the basket
  // is cleared.
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

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

  // The price of this exact order from the server, the same function the
  // payment is charged with (app/api/order-quote). The page shows its delivery
  // and total, so what is on screen is what Stripe is asked to take. Keyed by
  // everything that changes the price; a stale answer is never used.
  const quoteItems = state.items.map(item => ({ productId: item.product.id, size: item.size, frame: item.frame, quantity: item.quantity }));
  const quoteKey = JSON.stringify([quoteItems, selectedCountry.currency, formData.country, appliedDiscount?.code ?? null]);
  const [quote, setQuote] = useState<{ key: string; shipping: number; discountAmount: number; amount: number } | null>(null);
  useEffect(() => {
    if (!quoteItems.length) return;
    const controller = new AbortController();
    const [items, currency, countryCode, code] = JSON.parse(quoteKey);
    fetch('/api/order-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, currency: currency.toLowerCase(), countryCode, discountCode: code ?? undefined }),
      signal: controller.signal,
    })
      .then(r => (r.ok ? r.json() : null))
      .then(q => {
        if (q && typeof q.amount === 'number') setQuote({ key: quoteKey, shipping: q.shipping, discountAmount: q.discountAmount ?? 0, amount: q.amount });
      })
      .catch(() => { /* aborted, or offline: Pay stays disabled until a price arrives */ });
    return () => controller.abort();
    // quoteKey carries every input; quoteItems is derived from it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);
  const serverQuote = quote?.key === quoteKey ? quote : null;

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

  // One line's price, exactly as the order summary has always computed it.
  const linePrice = (item: (typeof state.items)[number]) => formatPrice({
    GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', item.size, 'GBP')) * item.quantity) * 100) / 100,
    NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', item.size, 'NOK')) * item.quantity) * 100) / 100,
    USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', item.size, 'USD')) * item.quantity) * 100) / 100,
    DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', item.size, 'DKK')) * item.quantity) * 100) / 100,
    SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', item.size, 'SEK')) * item.quantity) * 100) / 100
  });

  // Order line 275:5613 props for one basket item.
  const orderLineProps = (item: (typeof state.items)[number]) => {
    const frame = item.frame || 'no-frame';
    const frameText = v.frameLabels[frame] ?? getFrameName(frame);
    return {
      image: item.product.image,
      title: item.product.name,
      price: linePrice(item),
      artist: item.product.artist || item.product.brand || (item.product.artistId ? getArtistById(item.product.artistId)?.name : undefined),
      detail: item.size ? `${sizeLabel(item.size)}, ${frameText}` : frameText,
      quantity: fill(v.quantity, { n: item.quantity }),
      size: item.size,
    };
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

    finishOrder(captureOrder());
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

    finishOrder(captureOrder());
  };

  // The basket lives in localStorage, which the server cannot read, so the
  // server always rendered the empty-basket state and the first client render
  // (with items) failed hydration. Until hydrated, render only the heading
  // both sides agree on.
  if (!hydrated) {
    return (
      <div className="page-x pt-10 pb-section tab:pt-band">
        <h1 className="type-h1">{t.heading}</h1>
      </div>
    );
  }

  if (state.items.length === 0 && !orderComplete) {
    return (
      <div className="page-x flex flex-col items-start gap-group pt-10 pb-section tab:pt-band">
        <h1 className="type-h1">{t.cartEmpty}</h1>
        <Button href={productsHref}>{t.continueShopping}</Button>
      </div>
    );
  }

  if (orderComplete && completedOrder) {
    return <OrderComplete t={t} order={completedOrder} productsHref={productsHref} />;
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
  const addressFormat = getAddressFormat(selectedCountryCode, locale);

    // Get shipping cost in user's selected currency
  const shipping: number = shippingRate ? shippingRate.costs[selectedCountry.currency] || 0 : 0;

  // Calculate discount
  const discountAmount = serverQuote
    ? serverQuote.discountAmount
    : appliedDiscount
      ? Math.round((subtotal * appliedDiscount.percentage / 100) * 100) / 100
      : 0;

  const finalTax = 0; // No tax for any orders
  // The server's delivery price once it has answered; the old table only
  // until then (Pay is disabled meanwhile).
  const finalShipping = serverQuote ? serverQuote.shipping : shipping;

  const total = serverQuote
    ? serverQuote.amount
    : Math.round((subtotal + finalShipping + finalTax - discountAmount) * 100) / 100; // Round to 2 decimal places

  // Everything below is display: the same numbers as above, formatted the
  // way the summary always formatted them.
  const subtotalLabel = formatPrice({ GBP: subtotal, NOK: subtotal, USD: subtotal, DKK: subtotal, SEK: subtotal });
  const shippingLabel = finalShipping === 0 ? t.free : formatPrice({
    GBP: selectedCountry.currency === 'GBP' ? finalShipping : 0,
    NOK: selectedCountry.currency === 'NOK' ? finalShipping : 0,
    USD: selectedCountry.currency === 'USD' ? finalShipping : 0,
    DKK: selectedCountry.currency === 'DKK' ? finalShipping : 0,
    SEK: selectedCountry.currency === 'SEK' ? finalShipping : 0
  });
  const discountLabel = `−${formatPrice({ GBP: discountAmount, NOK: discountAmount, USD: discountAmount, DKK: discountAmount, SEK: discountAmount })}`;
  const totalLabel = formatPrice({ GBP: total, NOK: total, USD: total, DKK: total, SEK: total });
  const days = deliveryDays(shippingRate?.estimatedDays);
  const printCount = state.items.reduce((n, item) => n + item.quantity, 0);
  const printCountLabel = printCount === 1 ? v.printCountOne : fill(v.printCount, { n: printCount });
  const totals = {
    rows: [
      { label: t.subtotal, value: subtotalLabel },
      { label: t.shipping, value: shippingLabel },
      ...(appliedDiscount ? [{ label: `${t.discount} (${appliedDiscount.percentage}%)`, value: discountLabel }] : []),
    ],
    note: days ? fill(v.deliveryNote, days) : undefined,
    totalLabel: t.total,
    total: totalLabel,
  };

  // The confirmation is its own page (/order-confirmed) so it carries the full
  // header and footer, and survives a refresh. The order travels in
  // sessionStorage; where that is blocked, it shows here in place instead.
  function finishOrder(order: CompletedOrder) {
    setCompletedOrder(order);
    setOrderComplete(true);
    const saved = saveCompletedOrder(order);
    clearCart();
    if (saved) router.replace(locale === 'no' ? '/no/order-confirmed' : '/order-confirmed');
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // The confirmation's copy of the order, taken just before clearCart().
  function captureOrder(): CompletedOrder {
    const region = formData.state ? ` ${formData.state}` : '';
    return {
      firstName: formData.firstName.trim(),
      email: formData.email.trim(),
      lines: state.items.map(orderLineProps),
      totals,
      address: [
        `${formData.firstName} ${formData.lastName}`.trim(),
        formData.address,
        `${formData.city}${region} ${formData.zipCode}`.trim(),
        destinationName(formData.country, locale),
      ].filter(Boolean).join(', '),
      days,
    };
  }

  // Joins a field to the payment form (id="checkout-form") so the browser
  // validates it on Pay.
  const joined = publishableKey ? { form: 'checkout-form' } : {};

  return (
    <div>
      {/* Mobile: the order folds into one bar under the checkout nav. */}
      <button
        type="button"
        aria-expanded={summaryOpen}
        aria-controls="checkout-order"
        onClick={() => setSummaryOpen(open => !open)}
        className="flex w-full items-center justify-between gap-4 bg-image-bg px-margin py-4 text-left type-small desk:hidden"
      >
        <span className="flex items-center gap-2">
          {summaryOpen ? v.hideOrder : fill(v.showOrder, { count: printCountLabel })}
          <span aria-hidden className={`inline-block transition-transform ${summaryOpen ? 'rotate-180' : ''}`}>⌄</span>
        </span>
        <span className="type-body">{totalLabel}</span>
      </button>

      <div className="page-x page-grid pt-10 pb-section tab:pt-band">
        {/* Your order: the right column on desktop (6 + 4), folded under the
            bar on mobile and tablet. */}
        <aside
          id="checkout-order"
          aria-labelledby="checkout-order-heading"
          className={`${summaryOpen ? 'block' : 'hidden'} col-span-full pb-12 desk:col-span-4 desk:col-start-9 desk:row-start-1 desk:block desk:pt-[118px] desk:pb-0`}
        >
          <div className="flex items-baseline justify-between gap-4 pb-2">
            <h2 id="checkout-order-heading" className="type-h3">{v.yourOrder}</h2>
            <p className="type-small">{printCountLabel}</p>
          </div>
          <ul>
            {state.items.map(item => (
              <OrderLine key={`${item.product.id}-${item.size || 'no-size'}-${item.frame || 'no-frame'}`} {...orderLineProps(item)} />
            ))}
          </ul>

          {/* Discount Code Section */}
          <div className="flex flex-col gap-tight pt-6">
            {appliedDiscount ? (
              <div className="flex items-baseline justify-between gap-4">
                <p className="type-small">
                  {appliedDiscount.code}, {appliedDiscount.description}
                  <br />
                  {appliedDiscount.percentage}% {t.percentOff}
                </p>
                <Button variant="link" onClick={handleRemoveDiscount} className="type-body">{v.remove}</Button>
              </div>
            ) : (
              <div className="flex items-end gap-6">
                <TextField
                  id="discount-code"
                  label={t.discountPlaceholder}
                  placeholder={v.codePlaceholder}
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyDiscount(); } }}
                  autoComplete="off"
                  className="flex-1"
                />
                <Button variant="link" onClick={handleApplyDiscount} disabled={!discountCode.trim()} className="mb-2 type-body">
                  {t.apply}
                </Button>
              </div>
            )}
            {discountError && <p role="alert" className="type-small text-error">{discountError}</p>}
          </div>

          <OrderTotals {...totals} />
          <AssuranceLines lines={[v.assuranceMade, v.assuranceReturns, v.assuranceStripe]} />
        </aside>

        {/* Checkout Form */}
        <div className="col-span-full flex flex-col gap-band desk:col-span-6 desk:row-start-1">
          <h1 className="type-h1">{t.heading}</h1>

          <FormSection id="checkout-contact" number="01" title={v.contactTitle} subtitle={v.contactNote}>
            <TextField
              id="email"
              label={t.email}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              {...joined}
            />
          </FormSection>

          <FormSection id="checkout-address" number="02" title={v.deliveryTitle}>
            <div className="grid grid-cols-1 gap-group tab:grid-cols-2 tab:gap-x-8">
              <TextField
                id="firstName"
                label={t.firstName}
                autoComplete="given-name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                {...joined}
              />
              <TextField
                id="lastName"
                label={t.lastName}
                autoComplete="family-name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                {...joined}
              />
            </div>
            <TextField
              id="address"
              label={t.address}
              autoComplete="street-address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
              {...joined}
            />
            <div className="flex flex-col gap-tight">
              <label htmlFor="country" className="type-small">{t.country}</label>
              <CountryPicker
                t={t}
                locale={locale}
                value={formData.country}
                onChange={value => handleInputChange('country', value)}
              />
            </div>
            {/* Country sits above these because it decides what they
                are called and whether a region exists at all. */}
            <div
              className={`grid grid-cols-1 gap-group tab:gap-x-8 ${
                addressFormat.hasRegion ? 'tab:grid-cols-3' : 'tab:grid-cols-2'
              }`}
            >
              <TextField
                id="city"
                label={t.city}
                autoComplete="address-level2"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
                {...joined}
              />
              {addressFormat.hasRegion && (
                <TextField
                  id="state"
                  label={addressFormat.regionLabel ?? ''}
                  autoComplete="address-level1"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                  {...joined}
                />
              )}
              <TextField
                id="zipCode"
                label={addressFormat.postalLabel}
                autoComplete="postal-code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder={addressFormat.postalExample}
                required
                {...joined}
              />
            </div>
          </FormSection>

          <FormSection id="checkout-payment" number="03" title={v.paymentTitle}>
            {/* Payment form - always shown */}
            {publishableKey ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  total={total}
                  currency={selectedCountry.currency}
                  totalLabel={totalLabel}
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
                  priced={!!serverQuote}
                />
              </Elements>
            ) : (
              // Stripe failed to load
              <div className="flex flex-col gap-group">
                <FormError
                  title={v.unavailableTitle}
                  body={v.unavailableBody}
                  contact={fill(v.contactHelp, { email: COMPANY.email })}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTestMode}
                  className="self-start"
                >
                  {v.testMode}
                </Button>
              </div>
            )}

            {/* Test Mode Button - Only show in development */}
            {process.env.NODE_ENV === 'development' && publishableKey && (
              <div className="border-t border-line pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTestMode}
                >
                  {v.testMode}
                </Button>
              </div>
            )}
          </FormSection>
        </div>
      </div>
    </div>
  );
};
