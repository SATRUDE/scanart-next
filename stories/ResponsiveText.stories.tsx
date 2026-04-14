import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ResponsiveText } from '@/components/ResponsiveText';

const meta: Meta<typeof ResponsiveText> = {
  title: 'Components/ResponsiveText',
  component: ResponsiveText,
  decorators: [(Story) => <div className="bg-neutral-100 p-8"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ResponsiveText>;

export const Default: Story = {
  args: { text: 'SCANDINAVIAN ART' },
};

export const ShortText: Story = {
  args: { text: 'ART' },
};

export const LongText: Story = {
  args: { text: 'SCANDINAVIAN ART GALLERY COLLECTION' },
};
