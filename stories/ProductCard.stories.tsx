import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PrintCard } from '@/components/PrintCard';

const meta: Meta<typeof PrintCard> = {
  title: 'Components/ProductCard',
  component: PrintCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PrintCard>;

export const Default: Story = {
  args: {
    product: {
      id: '1',
      name: 'Birdie Blue',
      prices: {
        A3: { GBP: 42, NOK: 577, USD: 54, DKK: 367, SEK: 577 },
        A2: { GBP: 56, NOK: 770, USD: 72, DKK: 490, SEK: 770 },
      },
      image: '/images/products/birdie-blue.png',
      category: 'Abstract',
      brand: 'Renate Thor',
      inStock: true,
    },
    currency: 'GBP',
  },
};

export const OutOfStock: Story = {
  args: {
    product: {
      id: '2',
      name: 'Dragon',
      prices: {
        '50x70cm': { GBP: 56, NOK: 770, USD: 72, DKK: 490, SEK: 770 },
      },
      image: '/images/products/dragon.png',
      category: 'Illustrations',
      brand: 'Simen Strum',
      inStock: false,
    },
    currency: 'GBP',
  },
};

export const NOKCurrency: Story = {
  args: {
    ...Default.args,
    currency: 'NOK',
  },
};
