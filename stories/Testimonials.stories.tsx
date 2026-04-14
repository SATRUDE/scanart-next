import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Testimonials } from '@/components/Testimonials';

const meta: Meta<typeof Testimonials> = {
  title: 'Components/Testimonials',
  component: Testimonials,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Testimonials>;

export const Default: Story = {};
