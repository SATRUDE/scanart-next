import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';

const meta: Meta<typeof ProductImageGalleryWrapper> = {
  title: 'Components/ProductImageGallery',
  component: ProductImageGalleryWrapper,
  decorators: [(Story) => <div className="max-w-lg"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ProductImageGalleryWrapper>;

export const SingleImage: Story = {
  args: {
    images: ['/images/products/birdie-blue.png'],
    productName: 'Birdie Blue',
  },
};

export const MultipleImages: Story = {
  args: {
    images: ['/images/products/birdie-blue.png', '/images/products/birdie-blue-scene.avif'],
    productName: 'Birdie Blue',
  },
};

export const ThreeImages: Story = {
  args: {
    images: ['/images/products/dragon.png', '/images/products/dragon-scene.avif', '/images/products/dancer.png'],
    productName: 'Dragon',
  },
};
