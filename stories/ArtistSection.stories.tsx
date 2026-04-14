import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArtistSection } from '@/components/ArtistSection';

const meta: Meta<typeof ArtistSection> = {
  title: 'Components/ArtistSection',
  component: ArtistSection,
  decorators: [(Story) => <div className="max-w-3xl mx-auto p-8"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ArtistSection>;

export const RenateThor: Story = {
  args: {
    artist: {
      id: '3',
      name: 'Renate Thor',
      location: 'Trondheim, Norway',
      bio: 'Renate Thor is an Oslo-based illustrator, artist and graphic artist. She is known for her playful artworks and illustrations, using bold colours and compositions. She is driven by the process of her craft, allowing it to guide her to the result through free and playful experimentation.',
      image: '/images/artists/renate.png',
    },
  },
};

export const SimenWahlqvist: Story = {
  args: {
    artist: {
      id: '2',
      name: 'Simen Wahlqvist',
      location: 'Oslo, Norway',
      bio: 'Simen Wahlqvist is a Norwegian graphic designer and illustrator based in Oslo. In his work he aims to capture moments, often before they happen, with as few lines as possible.',
      image: '/images/artists/simen.png',
    },
  },
};

export const SiaSiamos: Story = {
  args: {
    artist: {
      id: '5',
      name: 'Sia Siamos',
      location: 'Bergen, Norway',
      bio: 'Athanasia Siamos is a Greek and Norwegian illustrator living in Bergen.',
      image: '/images/artists/sia-siamos.png',
    },
  },
};

export const NoImage: Story = {
  args: {
    artist: {
      id: '99',
      name: 'Unknown Artist',
      location: 'Stockholm, Sweden',
      bio: 'An emerging Scandinavian artist.',
      image: '',
    },
  },
};
