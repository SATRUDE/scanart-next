'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Truck, Shield, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartImage } from '@/components/SmartImage';
import { getProductPrice } from '@/lib/pricing';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '@/config/stripe';
import { OrderComplete } from '@/components/OrderComplete';
import { getShippingRate, formatShippingCost } from '@/config/shipping';
import { getFrameName, getFramePrice } from '@/config/frame';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface CheckoutPageProps {}

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
const PaymentForm: React.FC<{ 
  total: number; 
  currency: string; 
  onSuccess: () => void; 
  onError: (error: string) => void;
}> = ({ total, currency, onSuccess, onError }) => {
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

    (window as any).umami?.track('pay', {
      total,
      currency,
    });

    setIsProcessing(true);
    setError(null);

    try {
      // For testing purposes, always process through Stripe even for free orders
      // This allows us to test the full payment flow
      if (total === 0) {
        console.log('Free order detected - processing through Stripe for testing');
        // Create a minimal payment intent for free orders to test the flow
        console.log('Sending request to:', `/api/create-payment-intent`);
        
        // Calculate test amount based on currency (minimum Stripe requirement)
        let testAmount = 0.30; // Default for GBP (£0.30 - minimum Stripe amount)
        if (currency === 'USD') testAmount = 0.30; // $0.30 (minimum Stripe amount)
        else if (currency === 'NOK') testAmount = 4; // ~4 NOK ≈ £0.30
        else if (currency === 'DKK') testAmount = 3; // ~3 DKK ≈ £0.30
        else if (currency === 'SEK') testAmount = 4; // ~4 SEK ≈ £0.30
        
        const response = await fetch(`/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: testAmount,
            currency: currency.toLowerCase(),
          }),
        });

        const responseData = await response.json();
        console.log('Test payment intent response:', responseData);
        
        if (!responseData.clientSecret) {
          throw new Error('No client secret received from server');
        }

        const { clientSecret } = responseData;

        // Confirm payment with test amount
        const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        });

        if (paymentError) {
          setError(paymentError.message || 'Payment failed');
          onError(paymentError.message || 'Payment failed');
        } else {
          console.log('Test payment successful - proceeding with free order');
          onSuccess();
        }
        return;
      }

      // Create payment intent for paid orders
      console.log(`Sending payment request: ${total} ${currency}`);
      
      const response = await fetch(`/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: currency.toLowerCase(),
        }),
      });

      const responseData = await response.json();
      console.log('Payment intent response:', responseData);
      
      if (!responseData.clientSecret) {
        throw new Error('No client secret received from server');
      }

      const { clientSecret } = responseData;

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (paymentError) {
        setError(paymentError.message || 'Payment failed');
        onError(paymentError.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
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
          <Label htmlFor="card-element">Card Details</Label>
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
        >
          {isProcessing ? 'Processing...' : total === 0 ? `Test Payment (${currency === 'GBP' ? '£0.30' : currency === 'USD' ? '$0.30' : currency === 'NOK' ? '4 NOK' : currency === 'DKK' ? '3 DKK' : currency === 'SEK' ? '4 SEK' : '£0.30'})` : `Pay ${currency.toUpperCase()} ${total.toFixed(2)}`}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Purchasing can take up to a minute to process. Please do not refresh.
        </p>
      </div>
    </form>
  );
};

// Main Checkout Component
// Mock discount codes for demo purposes
const validDiscountCodes = {
  'WELCOME10': { percentage: 10, description: '10% off your first order' },
  'SUMMER15': { percentage: 15, description: '15% summer discount' },
  'SAVE20': { percentage: 20, description: '20% off' },
  'TRUDE100': { percentage: 100, description: '100% off + free shipping + no tax - Free with test charge!' },
};

export const CheckoutPage: React.FC<CheckoutPageProps> = () => {
  const router = useRouter();
  const onBack = () => router.push('/products');
  const { state, getTotalPriceInCurrency, clearCart } = useCart();
  const { formatPrice, selectedCountry } = useLanguage();
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number; description: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Debug log to verify component is loaded
  console.log('CheckoutPage loaded with discount codes:', Object.keys(validDiscountCodes));

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyDiscount = () => {
    const code = discountCode.toUpperCase();
    console.log('Applying discount code:', code);
    const discount = validDiscountCodes[code as keyof typeof validDiscountCodes];
    
    if (discount) {
      console.log('Discount applied:', discount);
      setAppliedDiscount({ code, ...discount });
      setDiscountError(null);
      setDiscountCode('');
    } else {
      console.log('Invalid discount code');
      setDiscountError('Invalid discount code');
      setAppliedDiscount(null);
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
        orderId: `ORD-${Date.now()}`,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: state.items.map(item => ({
          name: item.product.name,
          size: item.size,
          frame: item.frame && item.frame !== 'no-frame' ? getFrameName(item.frame) : null,
          quantity: item.quantity,
          price: formatPrice({ 
            GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', 'GBP')) * item.quantity) * 100) / 100, 
            NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', 'NOK')) * item.quantity) * 100) / 100, 
            USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', 'USD')) * item.quantity) * 100) / 100, 
            DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', 'DKK')) * item.quantity) * 100) / 100, 
            SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', 'SEK')) * item.quantity) * 100) / 100 
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

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  // Add test mode function
  const handleTestMode = async () => {
    try {
      // Prepare order data for Slack notification
      const orderData = {
        orderId: `TEST-${Date.now()}`,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: state.items.map(item => ({
          name: item.product.name,
          size: item.size,
          frame: item.frame && item.frame !== 'no-frame' ? getFrameName(item.frame) : null,
          quantity: item.quantity,
          price: formatPrice({ 
            GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', 'GBP')) * item.quantity) * 100) / 100, 
            NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', 'NOK')) * item.quantity) * 100) / 100, 
            USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', 'USD')) * item.quantity) * 100) / 100, 
            DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', 'DKK')) * item.quantity) * 100) / 100, 
            SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', 'SEK')) * item.quantity) * 100) / 100 
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
        orderId: `ORD-${Date.now()}`,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: state.items.map(item => ({
          name: item.product.name,
          size: item.size,
          frame: item.frame && item.frame !== 'no-frame' ? getFrameName(item.frame) : null,
          quantity: item.quantity,
          price: formatPrice({ 
            GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', 'GBP')) * item.quantity) * 100) / 100, 
            NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', 'NOK')) * item.quantity) * 100) / 100, 
            USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', 'USD')) * item.quantity) * 100) / 100, 
            DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', 'DKK')) * item.quantity) * 100) / 100, 
            SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', 'SEK')) * item.quantity) * 100) / 100 
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
          <h2 className="text-2xl mb-4">Your cart is empty</h2>
          <Button onClick={onBack}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return <OrderComplete onContinueShopping={onBack} />;
  }

  const subtotal = getTotalPriceInCurrency(selectedCountry.currency);
  
  // Map country names to country codes for shipping calculation
  const getCountryCode = (countryName: string): string => {
    const countryMap: { [key: string]: string } = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Sweden': 'SE',
      'Canada': 'ELSEWHERE' // Use ELSEWHERE for countries not in our shipping config
    };
    return countryMap[countryName] || 'ELSEWHERE';
  };
  
  // Get shipping rate for selected country in checkout form
  const selectedCountryCode = getCountryCode(formData.country);
  const shippingRate = getShippingRate(selectedCountryCode as any);
  
    // Get shipping cost in user's selected currency
  const shipping: number = shippingRate ? shippingRate.costs[selectedCountry.currency] || 0 : 0;
  
  // Remove tax completely - no tax charged
  const tax = 0;
  
  // Calculate discount
  const discountAmount = appliedDiscount 
    ? Math.round((subtotal * appliedDiscount.percentage / 100) * 100) / 100 
    : 0;
  
  // Special handling for TRUDE100 - remove tax and shipping costs
  const finalTax = 0; // No tax for any orders
  const finalShipping = appliedDiscount?.code === 'TRUDE100' ? 0 : shipping;
  
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
              <h1 className="text-3xl tracking-tight mb-2">Checkout</h1>
              <p className="text-muted-foreground">Complete your purchase below</p>
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
                    <Label htmlFor="email">Email</Label>
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
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(value: string) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Norway">Norway</SelectItem>
                        <SelectItem value="Denmark">Denmark</SelectItem>
                        <SelectItem value="Sweden">Sweden</SelectItem>
                      </SelectContent>
                    </Select>
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
                  {/* Always show payment form, even for free orders */}
                  {total === 0 && (
                    // Free order notice
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Free Order - Test Charge Required
                          </p>
                          <p className="text-xs text-green-600">
                            Your order is completely free thanks to the discount code! A small test charge will be made to test the payment flow.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment form - always shown */}
                  {publishableKey ? (
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        total={total}
                        currency={selectedCountry.currency}
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
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.items.map((item) => (
                  <div key={`${item.product.id}-${item.size || 'no-size'}-${item.frame || 'no-frame'}`} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <SmartImage
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
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
                        GBP: Math.round(((getProductPrice(item.product, item.size, 'GBP') + getFramePrice(item.frame || 'no-frame', 'GBP')) * item.quantity) * 100) / 100, 
                        NOK: Math.round(((getProductPrice(item.product, item.size, 'NOK') + getFramePrice(item.frame || 'no-frame', 'NOK')) * item.quantity) * 100) / 100, 
                        USD: Math.round(((getProductPrice(item.product, item.size, 'USD') + getFramePrice(item.frame || 'no-frame', 'USD')) * item.quantity) * 100) / 100, 
                        DKK: Math.round(((getProductPrice(item.product, item.size, 'DKK') + getFramePrice(item.frame || 'no-frame', 'DKK')) * item.quantity) * 100) / 100, 
                        SEK: Math.round(((getProductPrice(item.product, item.size, 'SEK') + getFramePrice(item.frame || 'no-frame', 'SEK')) * item.quantity) * 100) / 100 
                      })}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Discount Code Section */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Discount code"
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
                      Apply
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
                    <span>Subtotal</span>
                    <span>{formatPrice({ GBP: subtotal, NOK: subtotal, USD: subtotal, DKK: subtotal, SEK: subtotal })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{finalShipping === 0 ? 'Free' : formatPrice({ 
                      GBP: selectedCountry.currency === 'GBP' ? finalShipping : 0,
                      NOK: selectedCountry.currency === 'NOK' ? finalShipping : 0,
                      USD: selectedCountry.currency === 'USD' ? finalShipping : 0,
                      DKK: selectedCountry.currency === 'DKK' ? finalShipping : 0,
                      SEK: selectedCountry.currency === 'SEK' ? finalShipping : 0
                    })}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({appliedDiscount.percentage}%)</span>
                      <span>-{formatPrice({ GBP: discountAmount, NOK: discountAmount, USD: discountAmount, DKK: discountAmount, SEK: discountAmount })}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span>Total</span>
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
                    <h4 className="text-sm mb-1">Secure Checkout</h4>
                    <p className="text-xs text-muted-foreground">
                      Your payment information is encrypted and secure. We never store your credit card details.
                    </p>
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