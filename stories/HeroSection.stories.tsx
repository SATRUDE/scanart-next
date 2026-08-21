import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HeroSection } from '@/components/HeroSection';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Product } from '@/contexts/CartContext';

const mockProducts: Product[] = [
  {
    id: '1', name: 'Swallow Dive', slug: 'swallow-dive',
    prices: { A3: { GBP: 42, NOK: 577, USD: 54, DKK: 367, SEK: 577 }, A2: { GBP: 56, NOK: 770, USD: 72, DKK: 490, SEK: 770 } },
    image: '/images/products/swallow-dive.png', secondaryImage: '/images/products/swallow-dive-scene.avif',
    description: 'A cobalt swallow cut down to the plunge of its wings', category: 'Abstract', brand: 'Helene Brox',
    artist: 'Helene Brox', artistId: '', inStock: true, published: true, featured: true, sizes: { A3: true, A2: true },
  },
  {
    id: '2', name: 'Mean Snothing', slug: 'mean-snothing',
    prices: { '50x70cm': { GBP: 56, NOK: 770, USD: 72, DKK: 490, SEK: 770 } },
    image: '/images/products/mean-snothing.png', secondaryImage: '/images/products/mean-snothing-scene.avif',
    description: 'Abstract piece', category: 'Abstract', brand: 'Simen Strum',
    artist: 'Simen Strum', artistId: '', inStock: true, published: true, featured: true, sizes: { '50x70cm': true },
  },
];

const meta: Meta<typeof HeroSection> = {
  title: 'Components/HeroSection',
  component: HeroSection,
  decorators: [
    (Story) => (
      <LanguageProvider>
        <Story />
      </LanguageProvider>
    ),
  ],
  parameters: {
    nextjs: { appDirectory: true },
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof HeroSection>;

export const Default: Story = {
  args: { products: mockProducts },
};

export const NoProducts: Story = {
  args: { products: [] },
};
