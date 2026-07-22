import Link from 'next/link';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';

interface LandingCrossLinksProps {
  /** The landing this block sits on, so it never links back to itself. */
  current: { type: 'category' | 'collection'; slug: string };
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
export function LandingCrossLinks({ current }: LandingCrossLinksProps) {
  const categoryLinks = categoryLandings
    .filter(c => !(current.type === 'category' && c.slug === current.slug))
    .map(c => ({ href: `/category/${c.slug}`, label: c.heading }));

  const collectionLinks = collections
    .filter(c => !(current.type === 'collection' && c.slug === current.slug))
    .map(c => ({ href: `/collection/${c.slug}`, label: c.chipLabel }));

  return (
    <section className="mt-16">
      <h2 className="text-2xl text-neutral-900">Explore more</h2>
      <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">All prints</Link>
        {categoryLinks.map(l => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">{l.label}</Link>
        ))}
        {collectionLinks.map(l => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">{l.label}</Link>
        ))}
        <Link href="/artists" className="hover:text-foreground">Meet the artists</Link>
      </nav>
    </section>
  );
}
