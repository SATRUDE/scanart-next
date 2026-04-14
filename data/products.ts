import { Product } from '@/contexts/CartContext';

// Utility function to generate slugs from names
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

export const products: Product[] = [
  {
    id: '1',
    name: 'Dragon',
    slug: 'dragon',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/dragon.png',
    secondaryImage: '/images/products/dragon.png',
    description: 'This abstract Scandinavian wall art by Helene Brox features colourful art on museum-level paper, ensuring rich colours and archival longevity."',
    category: 'Abstract',
    brand: 'Helene Brox',
    artistId: '1',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '2',
    name: 'Mean Snothing',
    slug: 'mean-snothing',
    prices: {
      'default': {
        GBP: 42,
        NOK: 600,
        USD: 54,
        DKK: 370,
        SEK: 600
      }
    },
    image: '/images/products/mean-snothing.png',
    secondaryImage: '/images/products/mean-snothing-scene.avif',
    description: 'This striking Scandinavian wall art by Simen Wahlqvist showcases a vibrant illustration on high-quality, museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Illustrations',
    brand: 'Simen Wahlqvist',
    artistId: '2',
    inStock: true,
    sizes: {
      '50x50cm': true,
    },
  },
  {
    id: '3',
    name: 'Half Man',
    slug: 'half-man',
    prices: {
      'default': {
        GBP: 42,
        NOK: 600,
        USD: 54,
        DKK: 370,
        SEK: 600
      }
    },
    image: '/images/products/half-man.png',
    secondaryImage: '/images/products/half-man-scene.avif', // Alternative image for homepage
    description: 'This striking Scandinavian wall art by Simen Wahlqvist showcases a vibrant illustration on high-quality, museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Illustrations',
    brand: 'Simen Wahlqvist',
    artistId: '2',
    inStock: true,
    sizes: {
      '50x50cm': true,

    },
  },
  {
    id: '4',
    name: 'Eye Nose Eye',
    slug: 'eye-nose-eye',
    prices: {
      'default': {
        GBP: 42,
        NOK: 600,
        USD: 54,
        DKK: 370,
        SEK: 600
      }
    },
    image: '/images/products/eye-nose-eye.png',
    secondaryImage: '/images/products/eye-nose-eye-scene.avif', // Alternative image for homepage
    description: 'This striking Scandinavian wall art by Simen Wahlqvist showcases a vibrant illustration on high-quality, museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Illustrations',
    brand: 'Simen Wahlqvist',
    artistId: '2',
    inStock: true,
    sizes: {
      '50x50cm': true,
    },
  },
  {
    id: '5',
    name: 'Morgenstrekk',
    slug: 'morgenstrekk',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/morgenstrekk.png',
    secondaryImage: '/images/products/morgenstrekk-scene.avif', // Alternative image for homepage
    description: 'This striking Scandinavian wall art by Simen Wahlqvist showcases a vibrant illustration on high-quality, museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Illustrations',
    brand: 'Simen Wahlqvist',
    artistId: '2',
    inStock: true,
    sizes: {
      '50x50cm': true,
    },
  },
  {
    id: '6',
    name: 'Slingshot',
    slug: 'slingshot',
    prices: {
      'default': {
        GBP: 42,
        NOK: 600,
        USD: 54,
        DKK: 370,
        SEK: 600
      }
    },
    image: '/images/products/slingshot.png',
    secondaryImage: '/images/products/slingshot-scene.avif', // Alternative image for homepage
    description: 'This striking Scandinavian wall art by Simen Wahlqvist showcases a vibrant illustration on high-quality, museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Illustrations',
    brand: 'Simen Wahlqvist',
    artistId: '2',
    inStock: true,
    sizes: {
      '50x50cm': true,
    },
  },
  {
    id: '7',
    name: 'Dancer',
    slug: 'dancer',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/dancer.png',
    secondaryImage: '/images/products/dancer-scene.avif', // Alternative image for homepage
    description: 'This abstract Scandinavian wall art by Helene Brox features colourful art on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Helene Brox',
    artistId: '1',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '8',
    name: 'IThinkIThink',
    slug: 'ithinkithink',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/i-think-i-think.png',
    secondaryImage: '/images/products/i-think-i-think-scene.avif', // Alternative image for homepage
    description: 'This abstract Scandinavian wall art by Helene Brox features colourful art on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Helene Brox',
    artistId: '1',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '9',
    name: 'Swallow Dive',
    slug: 'swallow-dive',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/swallow-dive.png',
    secondaryImage: '/images/products/swallow-dive-scene.avif', // Alternative image for homepage
    description: 'This minimalist Scandinavian wall art by Helene Brox features colourful art on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Helene Brox',
    artistId: '1',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '10',
    name: 'Tree Top Peach',
    slug: 'tree-top-peach',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/tree-top-peach.png',
    secondaryImage: '/images/products/tree-top-peach-scene.avif', // Alternative image for homepage
    description: 'This minimalist Scandinavian wall art by Helene Brox features colourful art on museum-level paper, ensuring rich colours and archival longevity. ',
    category: 'Abstract',
    brand: 'Helene Brox',
    artistId: '1',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '11',
    name: 'Eltsjoen',
    slug: 'eltsjoen',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/eltsjoen.png',
    secondaryImage: '/images/products/eltsjoen-scene.avif', // Alternative image for homepage
    description: 'This vivid Scandinavian wall art by Ingunn Dybendall features vibrant art on museum-level paper, ensuring rich colours and archival longevity. ',
    category: 'Botanical',
    brand: 'Ingunn Dybendal',
    artistId: '4',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '12',
    name: 'Trysilkaffe',
    slug: 'trysilkaffe',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/trysilkaffe.png',
    secondaryImage: '/images/products/trysilkaffe-scene.avif', // Alternative image for homepage
    description: 'This vivid Scandinavian wall art by Ingunn Dybendall features vibrant art on museum-level paper, ensuring rich colours and archival longevity. ',
    category: 'Botanical',
    brand: 'Ingunn Dybendal',
    artistId: '4',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '13',
    name: 'Birdie Blue',
    slug: 'birdie-blue',
    prices: {
      'A3 (29.7 x 42cm)': {
        GBP: 42,
        NOK: 577,
        USD: 54,
        DKK: 367,
        SEK: 577
      },
      'A2 (42 x 59.4cm)': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      },
      'A1 (59.4 x 84.1cm)': {
        GBP: 77,
        NOK: 1058,
        USD: 99,
        DKK: 673,
        SEK: 1058
      }
    },
    image: '/images/products/birdie-blue.png',
    secondaryImage: '/images/products/birdie-blue-scene.avif', // Alternative image for homepage
    description: 'This vibrant Scandinavian wall art by Renate Thor features a colourful illustration on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Renate Thor',
    artistId: '3',
    inStock: true,
    sizes: {
      'A3 (29.7 x 42cm)': true,
      'A2 (42 x 59.4cm)': true,
      'A1 (59.4 x 84.1cm)': true,
    },
  },
  {
    id: '14',
    name: 'Birdie Brown',
    slug: 'birdie-brown',
    prices: {
      'A3 (29.7 x 42cm)': {
        GBP: 42,
        NOK: 577,
        USD: 54,
        DKK: 367,
        SEK: 577
      },
      'A2 (42 x 59.4cm)': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      },
      'A1 (59.4 x 84.1cm)': {
        GBP: 77,
        NOK: 1058,
        USD: 99,
        DKK: 673,
        SEK: 1058
      }
    },
    image: '/images/products/birdie-brown.png',
    secondaryImage: '/images/products/birdie-brown-scene.avif', // Alternative image for homepage
    description: 'This vibrant Scandinavian wall art by Renate Thor features a colourful illustration on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Renate Thor',
    artistId: '3',
    inStock: true,
    sizes: {
      'A3 (29.7 x 42cm)': true,
      'A2 (42 x 59.4cm)': true,
      'A1 (59.4 x 84.1cm)': true,
    },
  },
  {
    id: '15',
    name: 'Birdie Pink',
    slug: 'birdie-pink',
    prices: {
      'A3 (29.7 x 42cm)': {
        GBP: 42,
        NOK: 577,
        USD: 54,
        DKK: 367,
        SEK: 577
      },
      'A2 (42 x 59.4cm)': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      },
      'A1 (59.4 x 84.1cm)': {
        GBP: 77,
        NOK: 1058,
        USD: 99,
        DKK: 673,
        SEK: 1058
      }
    },
    image: '/images/products/birdie-pink.png',
    secondaryImage: '/images/products/birdie-pink-scene.avif', // Alternative image for homepage
    description: 'This vibrant Scandinavian wall art by Renate Thor features a colourful illustration on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Renate Thor',
    artistId: '3',
    inStock: true,
    sizes: {
      'A3 (29.7 x 42cm)': true,
      'A2 (42 x 59.4cm)': true,
      'A1 (59.4 x 84.1cm)': true,
    },
  },
  {
    id: '16',
    name: 'Birdie Green',
    slug: 'birdie-green',
    prices: {
      'A3 (29.7 x 42cm)': {
        GBP: 42,
        NOK: 577,
        USD: 54,
        DKK: 367,
        SEK: 577
      },
      'A2 (42 x 59.4cm)': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      },
      'A1 (59.4 x 84.1cm)': {
        GBP: 77,
        NOK: 1058,
        USD: 99,
        DKK: 673,
        SEK: 1058
      }
    },
    image: '/images/products/birdie-green.png',
    secondaryImage: '/images/products/birdie-green-scene.avif', // Alternative image for homepage
    description: 'This vibrant Scandinavian wall art by Renate Thor features a colourful illustration on museum-level paper, ensuring rich colours and archival longevity.',
    category: 'Abstract',
    brand: 'Renate Thor',
    artistId: '3',
    inStock: true,
    sizes: {
      'A3 (29.7 x 42cm)': true,
      'A2 (42 x 59.4cm)': true,
      'A1 (59.4 x 84.1cm)': true,
    },
  },
  {
    id: '17',
    name: 'Vinkveld',
    slug: 'vinkveld',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/vinkveld.png',
    secondaryImage: '/images/products/vinkveld-scene.avif', // Alternative image for homepage
    description: 'This lively artwork by Sia Siamos bursts with energy and colour, capturing a playful, expressive style that instantly enlivens any space. Printed on high-quality, museum-level paper to preserve its rich details and vibrant palette for years to come.',
    category: 'Botanical',
    brand: 'Sia Siamos',
    artistId: '5',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '18',
    name: 'Hyttefrokost',
    slug: 'hyttefrokost',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/Hyttefrokost.png',
    secondaryImage: '/images/products/Hyttefrokost-scene.avif', // Alternative image for homepage
    description: 'This lively artwork by Sia Siamos bursts with energy and colour, capturing a playful, expressive style that instantly enlivens any space. Printed on high-quality, museum-level paper to preserve its rich details and vibrant palette for years to come.',
    category: 'Botanical',
    brand: 'Sia Siamos',
    artistId: '5',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '19',
    name: 'Morgenlevering',
    slug: 'morgenlevering',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/Morgenlevering.png',
    secondaryImage: '/images/products/Morgenlevering-scene.avif', // Alternative image for homepage
    description: 'This lively artwork by Sia Siamos bursts with energy and colour, capturing a playful, expressive style that instantly enlivens any space. Printed on high-quality, museum-level paper to preserve its rich details and vibrant palette for years to come.',
    category: 'Botanical',
    brand: 'Sia Siamos',
    artistId: '5',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
  {
    id: '20',
    name: 'Hummer og Vin',
    slug: 'hummer-og-vin',
    prices: {
      'default': {
        GBP: 56,
        NOK: 770,
        USD: 72,
        DKK: 490,
        SEK: 770
      }
    },
    image: '/images/products/hummer-og-vin.png',
    secondaryImage: '/images/products/hummer-og-vin-scene.avif', // Alternative image for homepage
    description: 'This lively artwork by Sia Siamos bursts with energy and colour, capturing a playful, expressive style that instantly enlivens any space. Printed on high-quality, museum-level paper to preserve its rich details and vibrant palette for years to come.',
    category: 'Botanical',
    brand: 'Sia Siamos',
    artistId: '5',
    inStock: true,
    sizes: {
      '50x70cm': true,
    },
  },
];

export const categories = ['All', 'Botanical', 'Abstract', 'Photography', 'Illustrations'];

export const featuredProducts = [
  products.find(p => p.id === '13'), // Birdie Blue
  products.find(p => p.id === '2'),  // Mean Snothing
  products.find(p => p.id === '17'), // Vinkveld
].filter(Boolean);

// Helper function to get product by ID
export const getProductById = (id: string) => {
  return products.find(product => product.id === id);
};

// Helper function to get product by slug
export const getProductBySlug = (slug: string) => {
  return products.find(product => product.slug === slug);
};

// Helper function to get products by category
export const getProductsByCategory = (category: string) => {
  if (category === 'All') {
    return products;
  }
  return products.filter(product => product.category === category);
};