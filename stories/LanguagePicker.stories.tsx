import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LanguagePicker } from '@/components/LanguagePicker';
import { LanguageProvider } from '@/contexts/LanguageContext';

const meta: Meta<typeof LanguagePicker> = {
  title: 'Components/LanguagePicker',
  component: LanguagePicker,
  decorators: [
    (Story) => (
      <LanguageProvider>
        <div className="p-8">
          <Story />
        </div>
      </LanguageProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LanguagePicker>;

export const Default: Story = {};
