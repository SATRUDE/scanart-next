import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QualityPromise } from '@/components/QualityPromise';

const meta: Meta<typeof QualityPromise> = {
  title: 'Components/QualityPromise',
  component: QualityPromise,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof QualityPromise>;

export const Default: Story = {};
