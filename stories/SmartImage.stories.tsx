import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SmartImage } from '@/components/SmartImage';

const meta: Meta<typeof SmartImage> = {
  title: 'Components/SmartImage',
  component: SmartImage,
  decorators: [(Story) => <div className="w-64 h-64"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof SmartImage>;

export const PNG: Story = {
  args: {
    src: '/images/products/eltsjoen.png',
    alt: 'Eltsjoen',
    className: 'w-full h-full object-cover rounded',
  },
};

export const AVIF: Story = {
  args: {
    src: '/images/products/eltsjoen-scene.avif',
    alt: 'Eltsjoen Scene',
    className: 'w-full h-full object-cover rounded',
  },
};

export const WithSecondary: Story = {
  args: {
    src: '/images/products/eltsjoen.png',
    secondarySrc: '/images/products/eltsjoen-scene.avif',
    useSecondary: true,
    alt: 'Eltsjoen with secondary',
    className: 'w-full h-full object-cover rounded',
  },
};

export const BrokenImage: Story = {
  args: {
    src: '/images/does-not-exist.png',
    alt: 'Broken image fallback test',
    className: 'w-full h-full object-cover rounded',
  },
};
