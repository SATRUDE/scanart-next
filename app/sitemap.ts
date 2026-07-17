import type { MetadataRoute } from 'next';
import { getAllProducts, getProductLastEditedMap } from '@/lib/products';
import { getAllArticles } from '@/lib/articles';
import { artists } from '@/data/artists';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { BASE_URL } from '@/lib/site';

// Fallback for records without an edit date: the Next.js migration went live
// mid-April 2026, so nothing on this site is older than that.
const SITE_LAUNCH = new Date('2026-04-14');

function latest(dates: Date[]): Date {
  return dates.length ? new Date(Math.max(...dates.map(Number))) : SITE_LAUNCH;
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
    { url: BASE_URL, lastModified: latest([...productDates, ...articleDates]), priority: 1.0, changeFrequency: 'daily' },
    { url: `${BASE_URL}/products`, lastModified: latest(productDates), priority: 0.9, changeFrequency: 'weekly' },
    { url: `${BASE_URL}/journal`, lastModified: latest(articleDates), priority: 0.8, changeFrequency: 'weekly' },
    // artists hub; links every artist detail page, changes when the roster's prints do
    { url: `${BASE_URL}/artists`, lastModified: latest(productDates), priority: 0.7, changeFrequency: 'weekly' },
    // static page; date is its publication, bumped by hand when the copy changes
    { url: `${BASE_URL}/about`, lastModified: new Date('2026-07-10'), priority: 0.5, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/help`, lastModified: new Date('2026-07-12'), priority: 0.5, changeFrequency: 'monthly' },
    // legal pages; low priority, change rarely
    { url: `${BASE_URL}/privacy`, lastModified: new Date('2026-07-12'), priority: 0.3, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/terms`, lastModified: new Date('2026-07-12'), priority: 0.3, changeFrequency: 'yearly' },
    { url: `${BASE_URL}/delivery`, lastModified: new Date('2026-07-12'), priority: 0.3, changeFrequency: 'yearly' },
    // category landing pages exist only for categories with published work; a
    // category page changes when one of its prints does
    ...categoryLandings
      .filter(cat => products.some(p => p.category === cat.category))
      .map(cat => ({
        url: `${BASE_URL}/category/${cat.slug}`,
        lastModified: latest(
          products
            .filter(p => p.category === cat.category)
            .map(p => productEdited[p.slug])
            .filter(Boolean)
            .map(d => new Date(d))
        ),
        priority: 0.7 as const,
        changeFrequency: 'weekly' as const,
      })),
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
        lastModified: latest(
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
        lastModified: productEdited[p.slug] ? new Date(productEdited[p.slug]) : SITE_LAUNCH,
        priority: 0.7 as const,
        changeFrequency: 'monthly' as const,
        ...(images.length ? { images } : {}),
      };
    }),
    ...articles.map(a => {
      const image = siteImage(a.image);
      return {
        url: `${BASE_URL}/article/${a.slug}`,
        lastModified: a.last_edited_time ? new Date(a.last_edited_time) : SITE_LAUNCH,
        priority: 0.6 as const,
        changeFrequency: 'monthly' as const,
        ...(image ? { images: [image] } : {}),
      };
    }),
    // artist pages exist only for artists with published work; an artist page
    // changes when one of their prints does
    ...artists
      .filter(artist => products.some(p => p.artistId === artist.id))
      .map(artist => ({
        url: `${BASE_URL}/artist/${artist.slug}`,
        lastModified: latest(
          products
            .filter(p => p.artistId === artist.id)
            .map(p => productEdited[p.slug])
            .filter(Boolean)
            .map(d => new Date(d))
        ),
        priority: 0.6 as const,
        changeFrequency: 'monthly' as const,
      })),
  ];
}
