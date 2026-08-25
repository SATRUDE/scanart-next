import { TrackedLink } from '@/components/TrackedLink';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import type { CrossLinksStrings } from '@/lib/i18n';

// English defaults so existing callers render identically with no props.
const DEFAULT_STRINGS: CrossLinksStrings = {
  heading: 'Explore more',
  allPrints: 'All prints',
  wallArt: 'Scandinavian Wall Art',
  nordicArt: 'Nordic Art',
  meetTheArtists: 'Meet the artists',
  categoryLabels: {},
  collectionLabels: {},
};

interface LandingCrossLinksProps {
  /** The landing this block sits on, so it never links back to itself. */
  current: { type: 'category' | 'collection' | 'wall-art' | 'nordic-art'; slug: string };
  /** Localised labels; default to the English strings/config labels. */
  strings?: CrossLinksStrings;
  /**
   * 'no' points category, collection and artists-hub links into the /no tree,
   * where Norwegian pages exist. /products and the wall-art landing stay on
   * their English routes, which are still the only versions of those two.
   * Collections joined the /no tree in phase 2 (2026-08-21); before that they
   * were linked in English from the Norwegian pages, which leaked the tree
   * straight back out to English and is the fault this fixes.
   */
  locale?: 'en' | 'no';
}

/**
 * Shared "Explore more" cross-link block for the category and collection landing
 * pages. Both families draw search impressions but rank poorly, and before this
 * they barely linked to one another (category pages had no onward nav at all;
 * collection pages hardcoded /products + two categories + /artists), so link
 * equity and crawl paths did not flow between the doors-in we have built.
 *
 * Driven by the same categoryLandings/collections config the footer and sitemap
 * use, so the link set never drifts and picks up any new landing automatically.
 * The current page is filtered out so a page never self-links. Faithful to the
 * existing collection-page nav style (a flat wrap of small text links); no new
 * design language and no copy to write, labels come from the config.
 */
export function LandingCrossLinks({ current, strings = DEFAULT_STRINGS, locale = 'en' }: LandingCrossLinksProps) {
  const localePrefix = locale === 'no' ? '/no' : '';
  const artistsHref = locale === 'no' ? '/no/artists' : '/artists';
  const categoryLinks = categoryLandings
    .filter(c => !(current.type === 'category' && c.slug === current.slug))
    .map(c => ({
      href: `${localePrefix}/category/${c.slug}`,
      label: strings.categoryLabels[c.slug] ?? c.heading,
    }));

  const collectionLinks = collections
    .filter(c => !(current.type === 'collection' && c.slug === current.slug))
    .map(c => ({
      href: `${localePrefix}/collection/${c.slug}`,
      label: strings.collectionLabels[c.slug] ?? c.chipLabel,
    }));

  return (
    <section className="mt-16">
      <h2 className="text-2xl text-neutral-900">{strings.heading}</h2>
      <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <TrackedLink event="explore-more-click" eventData={{ from: `${current.type}/${current.slug}`, to: `${localePrefix}/products` }} href={`${localePrefix}/products`} className="hover:text-foreground">{strings.allPrints}</TrackedLink>
        {categoryLinks.map(l => (
          <TrackedLink key={l.href} event="explore-more-click" eventData={{ from: `${current.type}/${current.slug}`, to: l.href }} href={l.href} className="hover:text-foreground">{l.label}</TrackedLink>
        ))}
        {collectionLinks.map(l => (
          <TrackedLink key={l.href} event="explore-more-click" eventData={{ from: `${current.type}/${current.slug}`, to: l.href }} href={l.href} className="hover:text-foreground">{l.label}</TrackedLink>
        ))}
        {current.type !== 'wall-art' && (
          <TrackedLink event="explore-more-click" eventData={{ from: `${current.type}/${current.slug}`, to: `${localePrefix}/scandinavian-wall-art` }} href={`${localePrefix}/scandinavian-wall-art`} className="hover:text-foreground">{strings.wallArt}</TrackedLink>
        )}
        {/* English-only page for now, so the link stays off the /no variants. */}
        {current.type !== 'nordic-art' && locale === 'en' && (
          <TrackedLink event="explore-more-click" eventData={{ from: `${current.type}/${current.slug}`, to: '/nordic-art' }} href="/nordic-art" className="hover:text-foreground">{strings.nordicArt}</TrackedLink>
        )}
        <TrackedLink event="explore-more-click" eventData={{ from: `${current.type}/${current.slug}`, to: artistsHref }} href={artistsHref} className="hover:text-foreground">{strings.meetTheArtists}</TrackedLink>
      </nav>
    </section>
  );
}
