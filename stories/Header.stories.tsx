import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Header } from '@/components/Header';
import { CartProvider } from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
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
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {};
