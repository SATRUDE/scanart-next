'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartImage } from '@/components/SmartImage';
import { getProductPrices } from '@/lib/pricing';
import { getFrameName, getFramePrice } from '@/config/frame';

export const Cart: React.FC = () => {
  const {
    state,
    removeFromCart,
    updateQuantity,
    closeCart,
    getTotalPriceInCurrency,
  } = useCart();
  const { formatPrice, selectedCountry } = useLanguage();
  const router = useRouter();

  const handleCheckout = () => {
    (window as any).umami?.track('checkout', {
      itemCount: state.items.reduce((n, i) => n + i.quantity, 0),
      total: getTotalPriceInCurrency(selectedCountry.currency),
      currency: selectedCountry.currency,
    });
    closeCart();
    router.push('/checkout');
  };

  return (
    <Sheet open={state.isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg cart-slide-in">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>Review your selected items and proceed to checkout</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button onClick={closeCart} className="border border-neutral-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900">
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto py-6 px-6">
                <div className="space-y-6">
                  {state.items.map((item) => (
                    <div key={`${item.product.id}-${item.size || 'no-size'}-${item.frame || 'no-frame'}`} className="flex gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                        <SmartImage src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="text-sm">{item.product.name}</h4>
                            {item.size && <p className="text-xs text-muted-foreground">Size: {item.size.charAt(0).toUpperCase() + item.size.slice(1)}</p>}
                            {item.frame && item.frame !== 'no-frame' && <p className="text-xs text-muted-foreground">Frame: {getFrameName(item.frame)}</p>}
                          </div>
                          <button onClick={() => removeFromCart(item.product.id, item.size, item.frame)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button size="icon" className="h-6 w-6 border border-neutral-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.frame)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button size="icon" className="h-6 w-6 border border-neutral-200 bg-background text-foreground hover:bg-gray-50 hover:text-gray-900" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.frame)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm">
                            {formatPrice({
                              GBP: getProductPrices(item.product, item.size).GBP + getFramePrice(item.frame || 'no-frame', 'GBP'),
                              USD: getProductPrices(item.product, item.size).USD + getFramePrice(item.frame || 'no-frame', 'USD'),
                              NOK: getProductPrices(item.product, item.size).NOK + getFramePrice(item.frame || 'no-frame', 'NOK'),
                              DKK: getProductPrices(item.product, item.size).DKK + getFramePrice(item.frame || 'no-frame', 'DKK'),
                              SEK: getProductPrices(item.product, item.size).SEK + getFramePrice(item.frame || 'no-frame', 'SEK'),
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="border-t pt-6 px-6 space-y-4 my-[14px] mx-[0px]">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>{formatPrice({
                    GBP: selectedCountry.currency === 'GBP' ? getTotalPriceInCurrency('GBP') : 0,
                    NOK: selectedCountry.currency === 'NOK' ? getTotalPriceInCurrency('NOK') : 0,
                    USD: selectedCountry.currency === 'USD' ? getTotalPriceInCurrency('USD') : 0,
                    DKK: selectedCountry.currency === 'DKK' ? getTotalPriceInCurrency('DKK') : 0,
                    SEK: selectedCountry.currency === 'SEK' ? getTotalPriceInCurrency('SEK') : 0
                  })}</p>
                </div>
                <div className="flex justify-between"><p>Shipping</p><p>Calculated at checkout</p></div>
                <div className="flex justify-between text-lg border-t pt-4">
                  <p>Total</p>
                  <p>{formatPrice({
                    GBP: selectedCountry.currency === 'GBP' ? getTotalPriceInCurrency('GBP') : 0,
                    NOK: selectedCountry.currency === 'NOK' ? getTotalPriceInCurrency('NOK') : 0,
                    USD: selectedCountry.currency === 'USD' ? getTotalPriceInCurrency('USD') : 0,
                    DKK: selectedCountry.currency === 'DKK' ? getTotalPriceInCurrency('DKK') : 0,
                    SEK: selectedCountry.currency === 'SEK' ? getTotalPriceInCurrency('SEK') : 0
                  })}</p>
                </div>
                <Button onClick={handleCheckout} className="w-full">Checkout</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
