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
const eltsjoen = {
  name: 'Eltsjoen',
  artist: 'Simen Wahlqvist',
  category: 'Abstract',
  image: '/images/products/eltsjoen.png',
  secondaryImage: '/images/products/eltsjoen-scene.avif',
};

export const SingleImage: Story = {
  args: {
    images: productImages({ ...eltsjoen, secondaryImage: '' }),
    productName: 'Eltsjoen',
  },
};

export const MultipleImages: Story = {
  args: {
    images: productImages(eltsjoen),
    productName: 'Eltsjoen',
  },
};

export const ThreeImages: Story = {
  args: {
    images: [
      ...productImages({
        name: 'Slingshot',
        artist: 'Simen Wahlqvist',
        category: 'Illustrations',
        image: '/images/products/slingshot.png',
        secondaryImage: '/images/products/slingshot-scene.avif',
      }),
      {
        src: '/images/products/half-man.png',
        alt: 'Slingshot by Simen Wahlqvist, shown alongside another print in the series',
      },
    ],
    productName: 'Slingshot',
  },
};
