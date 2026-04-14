import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProductActions } from '@/components/ProductActions';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

const meta: Meta<typeof ProductActions> = {
  title: 'Components/ProductActions',
  component: ProductActions,
  decorators: [
    (Story) => (
      <LanguageProvider>
        <CartProvider>
          <div className="max-w-md p-8">
            <Story />
          </div>
        </CartProvider>
      </LanguageProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ProductActions>;

export const MultipleSizes: Story = {
  args: {
    product: {
      id: '1', name: 'Birdie Blue', slug: 'birdie-blue',
      prices: { A3: { GBP: 42, NOK: 577, USD: 54, DKK: 367, SEK: 577 }, A2: { GBP: 56, NOK: 770, USD: 72, DKK: 490, SEK: 770 }, A1: { GBP: 77, NOK: 1058, USD: 99, DKK: 673, SEK: 1058 } },
      image: '/images/products/birdie-blue.png', secondaryImage: '',
      description: '', category: 'Abstract', brand: 'Renate Thor',
      artist: 'Renate Thor', artistId: '', inStock: true, published: true, featured: false,
      sizes: { A3: true, A2: true, A1: true },
    },
  },
};

export const SingleSize: Story = {
  args: {
    product: {
      id: '2', name: 'Dragon', slug: 'dragon2',
      prices: { '50x70cm': { GBP: 56, NOK: 770, USD: 72, DKK: 490, SEK: 770 } },
      image: '/images/products/dragon.png', secondaryImage: '',
      description: '', category: 'Illustrations', brand: 'Simen Strum',
      artist: 'Simen Strum', artistId: '', inStock: true, published: true, featured: false,
      sizes: { '50x70cm': true },
    },
  },
};

export const SoldOut: Story = {
  args: {
    product: {
      id: '3', name: 'Sold Out Print', slug: 'sold-out',
      prices: {}, image: '/images/products/dragon.png', secondaryImage: '',
      description: '', category: 'Abstract', brand: 'Test',
      artist: '', artistId: '', inStock: false, published: true, featured: false,
      sizes: {},
    },
  },
};
