import { getAllProducts } from '@/lib/products';
import { getAllArticles } from '@/lib/articles';
import { getPublishedArtists } from '@/lib/published-artists';
import { categoryLandings } from '@/lib/categories';
import { getCollectionBySlug } from '@/lib/collections';
import { footerStrings } from '@/lib/i18n';
import { no } from '@/lib/i18n/no';
import type { SearchIndex } from '@/lib/site-search';

/**
 * The data behind the search overlay (Figma: Search overlay 242:4241), built
 * once per root layout on the server and handed to the Header as a prop.
 *
 * Kept deliberately small: it is serialised into every page, so it carries
 * only what a result row or tile shows (no descriptions, no secondary images,
 * no recommendation lists). About 20 prints, 5 artists and 16 stories today.
 *
 * Every href is written here, already inside /no on Norwegian pages, so the
 * client component never builds a path and cannot leak an English one. The
 * one exception is /article: articles are the site's one untranslated route,
 * and the /no journal links out to them on purpose (lib/i18n-no.test.ts).
 */
export async function buildSearchIndex(lang: 'en' | 'no'): Promise<SearchIndex> {
  const [products, articles, artists] = await Promise.all([getAllProducts(), getAllArticles(), getPublishedArtists()]);
  const p = lang === 'no' ? '/no' : '';
  const nameOf = (id?: string) => artists.find(a => a.id === id)?.name;

  const prints = products.map(product => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    // The same `artist || brand` fallback ProductsGrid matches on, so the
    // overlay's count and the /products?q= grid always agree.
    artist: product.artist || product.brand || nameOf(product.artistId) || '',
    artistId: product.artistId,
    brand: product.brand,
    category: product.category,
    image: product.image,
    inStock: product.inStock,
    prices: product.prices,
    href: `${p}/product/${product.slug}`,
  }));

  const artistRows = artists.map(artist => {
    const copy = lang === 'no' ? no.artists[artist.slug] : undefined;
    const bio = copy?.bio ?? artist.bio;
    const location = copy?.location ?? artist.location;
    return {
      slug: artist.slug,
      name: artist.name,
      // Artist card: "one line about the work". The bio's first sentence.
      line: bio.split(/(?<=\.)\s/)[0] ?? bio,
      city: location.split(',')[0],
      image: artist.image,
      printCount: artist.printCount,
      href: `${p}/artist/${artist.slug}`,
    };
  });

  const stories = articles.map(article => ({
    slug: article.slug,
    title: article.title,
    category: article.category,
    tags: article.tags ?? [],
    image: article.image,
    imageAlt: article.imageAlt ?? article.title,
    href: `/article/${article.slug}`,
  }));

  // Popular searches are links to real, indexable pages (categories, a
  // collection, an artist), never to a search URL: that is where the value
  // of the overlay's links lives (about-hero-motion.md, search section).
  const categoryLabels = footerStrings[lang].categoryLabels;
  const popular: { label: string; href: string }[] = categoryLandings
    .filter(landing => products.some(pr => pr.category === landing.category))
    .map(landing => ({ label: categoryLabels[landing.slug] ?? landing.category, href: `${p}/category/${landing.slug}` }));
  const kitchen = getCollectionBySlug('kitchen');
  if (kitchen) {
    popular.push({ label: footerStrings[lang].collectionLabels.kitchen ?? kitchen.chipLabel, href: `${p}/collection/kitchen` });
  }
  const featuredArtist = artistRows.find(a => a.slug === 'hedvig-wallin') ?? artistRows[0];
  if (featuredArtist) popular.push({ label: featuredArtist.name, href: featuredArtist.href });

  return { prints, artists: artistRows, stories, popular, productsHref: `${p}/products`, inspireHref: `${p}/inspire` };
}
