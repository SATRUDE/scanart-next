import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FullWidthImage } from '@/components/FullWidthImage';

const meta: Meta<typeof FullWidthImage> = {
  title: 'Components/FullWidthImage',
  component: FullWidthImage,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof FullWidthImage>;

export const Default: Story = {};
