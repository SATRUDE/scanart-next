import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PrintCard } from '@/components/PrintCard';
import { LanguageProvider } from '@/contexts/LanguageContext';

const meta: Meta<typeof PrintCard> = {
  title: 'Components/ProductCard',
  component: PrintCard,
  tags: ['autodocs'],
  decorators: [
    // The card prices itself from the language context when no currency prop
    // is passed, so stories need the provider exactly as the app does.
    (Story) => (
      <LanguageProvider>
        <div className="max-w-xs">
          <Story />
        </div>
      </LanguageProvider>
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
