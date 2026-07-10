// Category landing pages give each catalogue category one indexable URL of its
// own, instead of living only as a ?category= filter on /products. The `category`
// field must match the Product.category value in the baked catalogue data exactly.
// Shared between app/category/[slug]/page.tsx and app/sitemap.ts so the two never drift.

export interface CategoryLanding {
  slug: string;
  category: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
}

export const categoryLandings: CategoryLanding[] = [
  {
    slug: 'botanical',
    category: 'Botanical',
    title: 'Botanical Art Prints',
    description:
      'Scandinavian and Nordic botanical prints: plants, flowers and the natural world. Framing options and free UK delivery.',
    heading: 'Botanical Prints',
    intro:
      'Botanical prints from our Scandinavian and Nordic artists: plants, flowers and the natural world, chosen for the same considered, understated style that runs through the gallery. Framing options and free UK delivery.',
  },
  {
    slug: 'abstract',
    category: 'Abstract',
    title: 'Abstract Art Prints',
    description:
      'Nordic abstract wall art: shape, colour and composition pared back to what matters. Framing options and free UK delivery.',
    heading: 'Abstract Prints',
    intro:
      'Abstract prints with a Nordic sensibility: shape, colour and composition pared back to what matters. Nordic abstract wall art from the gallery’s Scandinavian artists, with framing options and free UK delivery.',
  },
  {
    slug: 'illustrations',
    category: 'Illustrations',
    title: 'Scandinavian Illustrations',
    description:
      'Scandinavian illustration prints from Nordic artists: characterful, hand-drawn work with clean lines. Framing options and free UK delivery.',
    heading: 'Illustrations',
    intro:
      'Scandinavian illustrations from our Nordic artists: characterful, hand-drawn work with the clean lines the region is known for. Framing options and free UK delivery.',
  },
];

export function getCategoryLandingBySlug(slug: string): CategoryLanding | undefined {
  return categoryLandings.find(c => c.slug === slug);
}
