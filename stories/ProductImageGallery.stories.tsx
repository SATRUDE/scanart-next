import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';
import { productImages } from '@/lib/product-image-alt';

const meta: Meta<typeof ProductImageGalleryWrapper> = {
  title: 'Components/ProductImageGallery',
  component: ProductImageGalleryWrapper,
  decorators: [(Story) => <div className="max-w-lg"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ProductImageGalleryWrapper>;

// Built the same way the product page builds them, so the stories show the
// real alt text rather than a hand-written stand-in.
const swallowDive = {
  name: 'Swallow Dive',
  artist: 'Helene Brox',
  category: 'Abstract',
  image: '/images/products/swallow-dive.png',
  secondaryImage: '/images/products/swallow-dive-scene.avif',
};

export const SingleImage: Story = {
  args: {
    images: productImages({ ...swallowDive, secondaryImage: '' }),
    productName: 'Swallow Dive',
  },
};

export const MultipleImages: Story = {
  args: {
    images: productImages(swallowDive),
    productName: 'Swallow Dive',
  },
};

export const ThreeImages: Story = {
  args: {
    images: [
      ...productImages({
        name: 'Dragon',
        artist: 'Helene Brox',
        category: 'Illustrations',
        image: '/images/products/dragon.png',
        secondaryImage: '/images/products/dragon-scene.avif',
      }),
      {
        src: '/images/products/dancer.png',
        alt: 'Dragon by Helene Brox, shown alongside another print in the series',
      },
    ],
    productName: 'Dragon',
  },
};
