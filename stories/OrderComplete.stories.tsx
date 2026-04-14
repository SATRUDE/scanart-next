import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OrderComplete } from '@/components/OrderComplete';

const meta: Meta<typeof OrderComplete> = {
  title: 'Components/OrderComplete',
  component: OrderComplete,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof OrderComplete>;

export const Default: Story = {
  args: {
    onContinueShopping: () => alert('Continue shopping clicked'),
  },
};

export const CustomMessage: Story = {
  args: {
    title: 'Payment Successful!',
    message: 'Your order has been placed and you will receive a confirmation email shortly.',
    buttonText: 'Back to Shop',
    onContinueShopping: () => alert('Back to shop clicked'),
  },
};

export const NoButton: Story = {
  args: {
    title: 'Processing...',
    message: 'Please wait while we confirm your order.',
  },
};
