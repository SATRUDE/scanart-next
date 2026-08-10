import type { MetadataRoute } from 'next';
import { getAllProducts, getProductLastEditedMap } from '@/lib/products';
import { getAllArticles } from '@/lib/articles';
import { artists } from '@/data/artists';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { BASE_URL } from '@/lib/site';
import { latestSitemapDate, sitemapDate } from '@/lib/sitemap-dates';

// The date the Norwegian translations of the hand-dated static pages went
// live; bump by hand when the Norwegian wording changes, as with the English
// dates below.
const NO_TRANSLATED = new Date('2026-08-07');

// hreflang alternates for a translated EN/NO pair, attached to BOTH entries
// of the pair so each URL declares the other (and English as the x-default).
// `enPath` is '' for the homepage.
function pairAlternates(enPath: string) {
  const en = `${BASE_URL}${enPath}`;
  const noUrl = `${BASE_URL}/no${enPath}`;
  return { languages: { en, no: noUrl, 'x-default': en } };
}

// Absolute URL for a site-relative image path, matching how the product and
// article pages build their JSON-LD/OG image URLs (new URL(path, BASE_URL)).
// Empty and externally-hosted images (e.g. an article hero hotlinked from
// another domain) are skipped so the image sitemap only ever references our
// own domain, which is what Google expects for the <image:image> extension.
function siteImage(src: string | undefined): string | undefined {
  if (!src || /^https?:\/\//i.test(src)) return undefined;
  return new URL(src, BASE_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();
  const articles = await getAllArticles();
  const productEdited = await getProductLastEditedMap();

  const productDates = products
    .map(p => productEdited[p.slug])
    .filter(Boolean)
    .map(d => new Date(d));
  const articleDates = articles
    .filter(a => a.last_edited_time)
    .map(a => new Date(a.last_edited_time));

  return [
    { url: BASE_URL, lastModified: latestSitemapDate([...productDates, ...articleDates]), priority: 1.0, changeFrequency: 'daily', alternates: pairAlternates('') },
    { url: `${BASE_URL}/products`, lastModified: latestSitemapDate(productDates), priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/journal`, lastModified: latestSitemapDate(articleDates), priority: 0.8, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/inspire`, lastModified: new Date('2026-08-06'), priority: 0.7, changeFrequency: 'weekly' },
    // artists hub; links every artist detail page, changes when the roster's prints do
    { url: `${BASE_URL}/artists`, lastModified: latestSitemapDate(productDates), priority: 0.7, changeFrequency: 'weekly', alternates: pairAlternates('/artists') },
    // static page; date is its publication, bumped by hand when the copy changes
    { url: `${BASE_URL}/about`, lastModified: new Date('2026-07-10'), priority: 0.5, changeFrequency: 'yearly', alternates: pairAlternates('/about') },
    { url: `${BASE_URL}/help`, lastModified: new Date('2026-07-12'), priority: 0.5, changeFrequency: 'monthly', alternates: pairAlternates('/help') },
    // legal pages; low priority, change rarely
    { url: `${BASE_URL}/privacy`, lastModified: new Date('2026-07-12'), priority: 0.3, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/terms`, lastModified: new Date('2026-07-12'), priority: 0.3, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/delivery`, lastModified: new Date('2026-07-12'), priority: 0.3, changeFrequency: 'yearly', alternates: pairAlternates('/delivery') },
    // the Norwegian tree (phase 1): the same stable pages under /no, dated by
    // the same content that dates their English twins; the hand-dated static
    // pages carry the translation date instead
    { url: `${BASE_URL}/no`, lastModified: latestSitemapDate([...productDates, ...articleDates]), priority: 1.0, changeFrequency: 'daily', alternates: pairAlternates('') },
    { url: `${BASE_URL}/no/artists`, lastModified: latestSitemapDate(productDates), priority: 0.7, changeFrequency: 'weekly', alternates: pairAlternates('/artists') },
    { url: `${BASE_URL}/no/about`, lastModified: NO_TRANSLATED, priority: 0.5, changeFrequency: 'yearly', alternates: pairAlternates('/about') },
    { url: `${BASE_URL}/no/help`, lastModified: NO_TRANSLATED, priority: 0.5, changeFrequency: 'monthly', alternates: pairAlternates('/help') },
    { url: `${BASE_URL}/no/delivery`, lastModified: NO_TRANSLATED, priority: 0.3, changeFrequency: 'yearly', alternates: pairAlternates('/delivery') },
    // wall-art landing shows the full catalogue, so it changes when any print does
    { url: `${BASE_URL}/scandinavian-wall-art`, lastModified: latestSitemapDate(productDates), priority: 0.8, changeFrequency: 'weekly' },
    // category landing pages exist only for categories with published work; a
    // category page changes when one of its prints does. Each has a Norwegian
    // twin under /no/category (same params, same product-driven date), and
    // the two entries declare each other via hreflang alternates.
    ...categoryLandings
      .filter(cat => products.some(p => p.category === cat.category))
      .flatMap(cat => {
        const lastModified = latestSitemapDate(
          products
            .filter(p => p.category === cat.category)
            .map(p => productEdited[p.slug])
            .filter(Boolean)
            .map(d => new Date(d))
        );
        const alternates = pairAlternates(`/category/${cat.slug}`);
        return [
          {
            url: `${BASE_URL}/category/${cat.slug}`,
            lastModified,
            priority: 0.7 as const,
            changeFrequency: 'weekly' as const,
            alternates,
          },
          {
            url: `${BASE_URL}/no/category/${cat.slug}`,
            lastModified,
            priority: 0.7 as const,
            changeFrequency: 'weekly' as const,
            alternates,
          },
        ];
      }),
    // curated collection landing pages (by room); a page changes when one of
    // its featured prints does, and only lists if at least one still exists
    ...collections
      .map(col => {
        const slugs = new Set(col.productSlugs);
        const featured = products.filter(p => slugs.has(p.slug));
        return { col, featured };
      })
      .filter(({ featured }) => featured.length > 0)
      .map(({ col, featured }) => ({
        url: `${BASE_URL}/collection/${col.slug}`,
        lastModified: latestSitemapDate(
          featured
            .map(p => productEdited[p.slug])
            .filter(Boolean)
            .map(d => new Date(d))
        ),
        priority: 0.7 as const,
        changeFrequency: 'weekly' as const,
      })),
    ...products.map(p => {
      // the print itself, plus a distinct secondary shot where one exists
      const images = [...new Set(
        [siteImage(p.image), siteImage(p.secondaryImage)].filter(
          (u): u is string => Boolean(u)
        )
      )];
      return {
        url: `${BASE_URL}/product/${p.slug}`,
        lastModified: sitemapDate(productEdited[p.slug]),
        priority: 0.7 as const,
        changeFrequency: 'monthly' as const,
        ...(images.length ? { images } : {}),
      };
    }),
    ...articles.map(a => {
      const image = siteImage(a.image);
      return {
        url: `${BASE_URL}/article/${a.slug}`,
        lastModified: sitemapDate(a.last_edited_time),
        priority: 0.6 as const,
        changeFrequency: 'monthly' as const,
        ...(image ? { images: [image] } : {}),
      };
    }),
    // artist pages exist only for artists with published work; an artist page
    // changes when one of their prints does. Each has a Norwegian twin under
    // /no/artist (same params, same product-driven date), and the two entries
    // declare each other via hreflang alternates.
    ...artists
      .filter(artist => products.some(p => p.artistId === artist.id))
      .flatMap(artist => {
        const lastModified = latestSitemapDate(
          products
            .filter(p => p.artistId === artist.id)
            .map(p => productEdited[p.slug])
            .filter(Boolean)
            .map(d => new Date(d))
        );
        const alternates = pairAlternates(`/artist/${artist.slug}`);
        return [
          {
            url: `${BASE_URL}/artist/${artist.slug}`,
            lastModified,
            priority: 0.6 as const,
            changeFrequency: 'monthly' as const,
            alternates,
          },
          {
            url: `${BASE_URL}/no/artist/${artist.slug}`,
            lastModified,
            priority: 0.6 as const,
            changeFrequency: 'monthly' as const,
            alternates,
          },
        ];
      }),
  ];
}
