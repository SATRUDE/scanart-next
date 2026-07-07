import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/CheckoutPage';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your purchase - Scandinavian Art Gallery',
  alternates: {
    canonical: '/checkout',
  },
};

export default function Checkout() {
  return <CheckoutPage />;
}
