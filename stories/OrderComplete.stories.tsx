import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OrderComplete } from '@/components/OrderComplete';
import { checkoutStringsEn } from '@/components/CheckoutPage';

const meta: Meta<typeof OrderComplete> = {
  title: 'Components/OrderComplete',
  component: OrderComplete,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof OrderComplete>;

export const Default: Story = {
  args: {
    t: checkoutStringsEn,
    productsHref: '/products',
    order: {
      firstName: 'Name',
      email: 'name@example.com',
      lines: [
        {
          image: '/images/products/slingshot.png',
          title: 'Slingshot',
          price: '£67',
          artist: 'Simen Wahlqvist',
          detail: '50 × 50 cm, wood frame',
          quantity: 'Quantity 1',
          size: '50x50cm',
        },
      ],
      totals: {
        rows: [
          { label: 'Subtotal', value: '£67' },
          { label: 'Delivery', value: '£5.99' },
        ],
        note: 'Delivered 2 to 3 business days after it is made',
        totalLabel: 'Total',
        total: '£72.99',
      },
      address: 'Name Surname, 1 Example Street, London SW1A 1AA, United Kingdom',
      days: { from: '2', to: '3' },
    },
  },
};
