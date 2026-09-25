import { TrackedLink } from '@/components/TrackedLink';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import type { CrossLinksStrings } from '@/lib/i18n';

const DEFAULT_STRINGS: CrossLinksStrings = {
  heading: 'Explore the shop',
  allPrints: 'All prints',
  wallArt: 'Scandinavian wall art',
  nordicArt: 'Nordic art',
  meetTheArtists: 'Meet the artists',
  categoryLabels: {},
  collectionLabels: {},
};

interface LandingCrossLinksProps {
  /** The page it sits on, so it never links to itself. Omit on pages that are not landings. */
  current?: { type: 'category' | 'collection' | 'wall-art' | 'nordic-art' | 'page'; slug: string };
  strings?: CrossLinksStrings;
  locale?: 'en' | 'no';
  /** Artists with published prints, for the second column. Without it the column is a single "Meet the artists" link. */
  artists?: { slug: string; name: string }[];
  className?: string;
}

/**
 * Explore the shop (Figma 241:3800): the closing link block above the footer
 * on listing, product, journal and profile pages. Categories, collections and
 * the two guides in one column, every artist in the other, in the serif.
 *
 * It is also the landing pages' cross-linking (was "Explore more"), which is
 * how every category, collection and guide page links to the rest: it never
 * links to the page it is on, and /nordic-art stays off the Norwegian pages
 * because that page has no twin (docs/v2-seo.md).
 */
export function LandingCrossLinks({ current = { type: 'page', slug: '' }, strings = DEFAULT_STRINGS, locale = 'en', artists, className = '' }: LandingCrossLinksProps) {
  const localePrefix = locale === 'no' ? '/no' : '';
  const artistsHref = locale === 'no' ? '/no/artists' : '/artists';
  const from = `${current.type}/${current.slug}`;

  const shopLinks = [
    ...categoryLandings
      .filter(c => !(current.type === 'category' && c.slug === current.slug))
      .map(c => ({ href: `${localePrefix}/category/${c.slug}`, label: strings.categoryLabels[c.slug] ?? c.category })),
    ...collections
      .filter(c => !(current.type === 'collection' && c.slug === current.slug))
      .map(c => ({ href: `${localePrefix}/collection/${c.slug}`, label: strings.collectionLabels[c.slug] ?? c.chipLabel })),
    ...(current.type !== 'nordic-art' && locale === 'en' ? [{ href: '/nordic-art', label: strings.nordicArt }] : []),
    ...(current.type !== 'wall-art' ? [{ href: `${localePrefix}/scandinavian-wall-art`, label: strings.wallArt }] : []),
    { href: `${localePrefix}/products`, label: strings.allPrints },
  ];
  const artistLinks = artists?.length
    ? artists.map(a => ({ href: `${localePrefix}/artist/${a.slug}`, label: a.name }))
    : [{ href: artistsHref, label: strings.meetTheArtists }];

  const linkCls = 'transition-colors hover:text-brand';

  return (
    <section aria-labelledby="explore-the-shop" className={`page-grid gap-y-6 ${className}`}>
      <div className="col-span-full border-t border-ink pt-4 tab:pt-6 desk:col-span-4">
        <h2 id="explore-the-shop" className="type-h2">{strings.heading}</h2>
      </div>
      <nav aria-label={strings.heading} className="col-span-full grid gap-4 tab:grid-cols-2 tab:gap-x-8 desk:col-span-8 desk:border-t desk:border-ink desk:pt-6">
        <ul className="flex flex-col gap-1 tab:gap-2 type-h3">
          {shopLinks.map(l => (
            <li key={l.href}>
              <TrackedLink event="explore-more-click" eventData={{ from, to: l.href }} href={l.href} className={linkCls}>{l.label}</TrackedLink>
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-1 tab:gap-2 type-h3">
          {artistLinks.map(l => (
            <li key={l.href}>
              <TrackedLink event="explore-more-click" eventData={{ from, to: l.href }} href={l.href} className={linkCls}>{l.label}</TrackedLink>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
