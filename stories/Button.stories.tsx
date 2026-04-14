import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Shop Prints' },
};

export const Outline: Story = {
  args: { children: 'All categories', variant: 'outline' },
};

export const Large: Story = {
  args: { children: 'Add to Cart', size: 'lg' },
};

export const WithIcon: Story = {
  render: () => (
    <Button size="lg">
      <ShoppingBag className="h-4 w-4 mr-2" />
      Add to Cart
    </Button>
  ),
};

export const Ghost: Story = {
  args: { children: 'Continue Shopping', variant: 'ghost' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};
