import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Cart } from '@/components/Cart';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

function CartWithToggle() {
  const { toggleCart, addToCart } = useCart();

  const addSampleItem = () => {
    addToCart({
      id: '1', name: 'Birdie Blue', slug: 'birdie-blue',
      prices: { A3: { GBP: 42, NOK: 577, USD: 54, DKK: 367, SEK: 577 } },
      image: '/images/products/birdie-blue.png', secondaryImage: '',
      description: '', category: 'Abstract', brand: 'Renate Thor',
      artist: 'Renate Thor', artistId: '', inStock: true, published: true, featured: false,
      sizes: { A3: true },
    }, 1, 'A3');
  };

  return (
    <div className="p-8 space-x-4">
      <Button onClick={addSampleItem}>Add Item to Cart</Button>
      <Button variant="outline" onClick={toggleCart}>Open Cart</Button>
      <Cart />
    </div>
  );
}

const meta: Meta = {
  title: 'Components/Cart',
  decorators: [
    (Story) => (
      <LanguageProvider>
        <CartProvider>
          <Story />
        </CartProvider>
      </LanguageProvider>
    ),
  ],
  parameters: {
    nextjs: { appDirectory: true },
  },
};

export default meta;

export const Default: StoryObj = {
  render: () => <CartWithToggle />,
};
