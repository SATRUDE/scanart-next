import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AvifImage } from '@/components/AvifImage';

const meta: Meta<typeof AvifImage> = {
  title: 'Components/AvifImage',
  component: AvifImage,
  decorators: [(Story) => <div className="w-64 h-80"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof AvifImage>;

export const Default: Story = {
  args: {
    src: '/images/products/swallow-dive-scene.avif',
    alt: 'Swallow Dive Scene',
    className: 'w-full h-full object-cover rounded',
  },
};

export const WithFallback: Story = {
  args: {
    src: '/images/products/dragon-scene.avif',
    fallbackSrc: '/images/products/dragon.png',
    alt: 'Dragon with PNG fallback',
    className: 'w-full h-full object-cover rounded',
  },
};
