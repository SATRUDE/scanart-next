import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArtistSection } from '@/components/ArtistSection';

const meta: Meta<typeof ArtistSection> = {
  title: 'Components/ArtistSection',
  component: ArtistSection,
  decorators: [(Story) => <div className="max-w-3xl mx-auto p-8"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ArtistSection>;

export const HeleneBrox: Story = {
  args: {
    artist: {
      id: '1',
      name: 'Helene Brox',
      slug: 'helene-brox',
      location: 'Oslo, Norway',
      bio: 'Helene Brox is an artist and illustrator based in Oslo, Norway.',
      image: '/images/artists/helene-brox.png',
    },
  },
};

export const SimenWahlqvist: Story = {
  args: {
    artist: {
      id: '2',
      name: 'Simen Wahlqvist',
      slug: 'simen-wahlqvist',
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
      slug: 'sia-siamos',
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
      slug: 'unknown-artist',
      location: 'Stockholm, Sweden',
      bio: 'An emerging Scandinavian artist.',
      image: '',
    },
  },
};
