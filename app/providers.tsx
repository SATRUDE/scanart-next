'use client';

import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SalePromotionProvider } from '@/contexts/SalePromotionContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <SalePromotionProvider>{children}</SalePromotionProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
