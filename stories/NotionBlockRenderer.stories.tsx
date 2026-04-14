import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NotionBlockRenderer } from '@/components/NotionBlockRenderer';

const meta: Meta<typeof NotionBlockRenderer> = {
  title: 'Components/NotionBlockRenderer',
  component: NotionBlockRenderer,
  decorators: [(Story) => <div className="max-w-3xl mx-auto p-8"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof NotionBlockRenderer>;

export const AllBlockTypes: Story = {
  args: {
    blocks: [
      { id: '1', type: 'heading_1', heading_1: { rich_text: [{ plain_text: 'Main Heading' }] } },
      { id: '2', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'This is a paragraph of text that demonstrates how article content renders from Notion blocks.' }] } },
      { id: '3', type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Section Heading' }] } },
      { id: '4', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Another paragraph with more content about Scandinavian art and design.' }] } },
      { id: '5', type: 'heading_3', heading_3: { rich_text: [{ plain_text: 'Subsection' }] } },
      { id: '6', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'First bullet point' }] } },
      { id: '7', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'Second bullet point' }] } },
      { id: '8', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'Third bullet point' }] } },
      { id: '9', type: 'divider' },
      { id: '10', type: 'quote', quote: { rich_text: [{ plain_text: 'Art is not what you see, but what you make others see.' }] } },
      { id: '11', type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Final paragraph after the quote.' }] } },
    ],
  },
};

export const NumberedList: Story = {
  args: {
    blocks: [
      { id: '1', type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Steps to Choose Art' }] } },
      { id: '2', type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: 'Consider your space and lighting' }] } },
      { id: '3', type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: 'Choose a colour palette' }] } },
      { id: '4', type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: 'Select the right size' }] } },
      { id: '5', type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: 'Pick a frame that complements' }] } },
    ],
  },
};
