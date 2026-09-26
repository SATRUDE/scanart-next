import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { collections } from './collections';
import { categoryLandings } from './categories';
import { no } from './i18n/no';
import { noPathFor } from './i18n';

/**
 * A route group folder, `(shop)`: it organises the tree and shares a layout
 * without adding a URL segment (app/(en)/(shop) holds /products, /category and
 * /collection). The derived guards below read routes from the folders, so they
 * look through a group as if its children sat one level up; otherwise moving a
 * page into a group would hide it from them.
 */
const isRouteGroup = (entry: string) => /^\(.+\)$/.test(entry);

/** The directories that are URL segments directly under `dir`, looking through route groups. */
const segmentDirs = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    if (!statSync(join(dir, entry)).isDirectory()) return [];
    return isRouteGroup(entry) ? segmentDirs(join(dir, entry)) : [entry];
  });

// The Norwegian pages fall back to the English copy when a translation is
// missing, which keeps a page from 404ing but fails silently: a mistyped key or
// a landing added without its translation ships an English page on a /no URL,
// which is worse than useless because hreflang then promises Norwegian. These
// tests make that failure loud, and are cheap next to spotting it on a deploy.
describe('Norwegian dictionary', () => {
  it('translates every collection landing', () => {
    for (const c of collections) {
      expect(no.collections[c.slug], `no translation for collection "${c.slug}"`).toBeDefined();
    }
  });

  it('translates every category landing', () => {
    for (const c of categoryLandings) {
      expect(no.categories[c.slug], `no translation for category "${c.slug}"`).toBeDefined();
    }
  });

  it('gives every collection a Norwegian cross-link label', () => {
    for (const c of collections) {
      expect(
        no.crossLinks.collectionLabels[c.slug],
        `no cross-link label for collection "${c.slug}"`
      ).toBeTruthy();
    }
  });

  it('matches the English styling-card count, so no card loses its words', () => {
    for (const c of collections) {
      const copy = no.collections[c.slug];
      if (!copy) continue;
      expect(
        copy.stylingCards?.length ?? 0,
        `styling-card count differs for "${c.slug}"`
      ).toBe(c.stylingCards?.length ?? 0);
    }
  });

  it('carries a styling tip list for every collection', () => {
    for (const c of collections) {
      const copy = no.collections[c.slug];
      if (!copy) continue;
      expect(copy.stylingTips.length, `"${c.slug}" has no Norwegian styling tips`).toBeGreaterThan(0);
    }
  });

  it('uses no em dashes anywhere: the house rule, in both languages', () => {
    const offenders: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (value.includes('—')) offenders.push(path);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
        return;
      }
      if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    walk(no, 'no');
    expect(offenders, `em dashes found at: ${offenders.join(', ')}`).toEqual([]);
  });

  // This fault has now happened three times as the /no tree grew: the cross-link
  // block and the footer both hardcoded English /collection hrefs (fixed in
  // PR #160), and the Norwegian artist editorial still linked
  // /collection/bedroom and /collection/home-office in English because no twin
  // existed when that copy was written. Each one silently leaked a Norwegian
  // reader back out to English, which is the exact fault that left /no
  // uncrawlable in the first place. noPathFor is the single source of truth for
  // whether a twin exists, so asking it is the durable guard: build a Norwegian
  // page and this test starts demanding the links follow.
  it('never links out to an English route that has a Norwegian twin', () => {
    const offenders: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        for (const m of value.matchAll(/\]\((\/[^)\s]+)\)/g)) {
          const href = m[1];
          if (href.startsWith('/no')) continue;
          if (noPathFor(href)) offenders.push(`${path} -> ${href} (twin: ${noPathFor(href)})`);
        }
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
        return;
      }
      if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    walk(no, 'no');
    expect(offenders, `Norwegian copy links to English pages that have a /no twin:\n${offenders.join('\n')}`).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // The same fault, in the JSX this time.
  //
  // The test above walks the Norwegian COPY. It has never seen an href written
  // in a page or a component, which is where the leak had quietly grown to 19
  // of the 48 links on /no by 25 Aug 2026: all three hero prints, /products
  // four times, wall art, privacy, terms, and every print on the Norwegian
  // category and collection pages. Each one was correct when written and went
  // stale the day its Norwegian twin shipped.
  //
  // So the answer is not a list. It is derived from the routes that exist:
  // a directory under app/(no)/no IS the Norwegian twin of the same-named
  // English route. Ship a new Norwegian page and this test starts demanding
  // the links follow it, which is the only version of this guard that does not
  // need somebody to remember.
  const APP_NO = join(process.cwd(), 'app', '(no)', 'no');

  /** First path segment of an internal href: '/product/dragon?x=1' -> 'product'. */
  const firstSegment = (href: string) => href.split(/[?#]/)[0].split('/')[1] ?? '';

  /** The English route segments that now have a Norwegian page of their own. */
  const translatedSegments = new Set(segmentDirs(APP_NO));

  const tsxFilesUnder = (dir: string): string[] =>
    readdirSync(dir).flatMap(entry => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return tsxFilesUnder(full);
      return entry.endsWith('.tsx') ? [full] : [];
    });

  /**
   * EVERY component, not a list of the ones known to render under /no. A
   * component mounted in the Norwegian tree that hardcodes an English path is
   * a leak on half its renders, and which components those are is not visible
   * from here: FullWidthImage was missed on the first pass of this very fix
   * precisely because it was not on a hand-picked list of three.
   *
   * Sweeping all of them costs nothing. A literal English href in a shared
   * component is either a leak already or one render away from being one, so
   * the honest default is that they all carry their locale, and the fix in
   * every case is a prefix the component already has or a `locale` prop.
   */
  const COMPONENTS = join(process.cwd(), 'components');

  it('never links out of the Norwegian tree to a route that has a /no page', () => {
    const offenders: string[] = [];
    for (const file of [...tsxFilesUnder(APP_NO), ...tsxFilesUnder(COMPONENTS)]) {
      const source = readFileSync(file, 'utf8');
      // href="/x" and href={`/x/${...}`}. A template literal that opens with an
      // interpolation (href={`${prefix}/x`}) is locale-aware by construction and
      // is not a literal English path, so it is not matched here.
      for (const m of source.matchAll(/href=(?:"(\/[^"]*)"|\{`(\/[^`$]*))/g)) {
        const href = m[1] ?? m[2];
        if (href.startsWith('/no/') || href === '/no') continue;
        const segment = firstSegment(href);
        if (translatedSegments.has(segment)) {
          offenders.push(`${file.replace(process.cwd() + '/', '')} -> ${href} (twin: /no${href})`);
        }
      }
    }
    expect(
      offenders,
      `Links inside the Norwegian tree point at English pages that have a /no twin:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  // Articles are the one genuinely untranslated part of the site, so the /no
  // journal and the Norwegian collection pages link out to /article on purpose.
  // Pinning it means the guard above cannot be "fixed" by translating articles
  // halfway and leaving the links pointing at pages that do not exist.
  it('treats articles as the one untranslated route', () => {
    expect(translatedSegments.has('article')).toBe(false);
    expect(translatedSegments.has('product')).toBe(true);
    expect(translatedSegments.has('products')).toBe(true);
  });

  // The apply form is not a /no-prefix-and-done route, so it fell outside the
  // pattern and the language control had nothing to offer on the English page.
  it('maps the artist apply page to its Norwegian twin', () => {
    expect(noPathFor('/artists/apply')).toBe('/no/artists/apply');
  });

  it('maps a collection path to its Norwegian twin', () => {
    expect(noPathFor('/collection/living-room')).toBe('/no/collection/living-room');
    expect(noPathFor('/category/botanical')).toBe('/no/category/botanical');
    expect(noPathFor('/product/swallow-dive')).toBe('/no/product/swallow-dive');
    expect(noPathFor('/article/what-is-scandinavian-art')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hreflang has to point BOTH ways or Google throws the annotation away.
//
// Every Norwegian page declared its pair (`en` at the English twin, `no` at
// itself, `x-default` at the English twin) and 23 of the 40 English twins
// declared nothing back: all 16 product pages, plus /products, /artists/apply,
// /inspire, /journal, /privacy, /terms and /scandinavian-wall-art. Verified by
// fetching every sitemap URL as Googlebot on 27 Aug 2026 and parsing the
// rendered head, because grepping the source for this has been wrong here
// before. Google's localized-versions guidance is explicit that a return link
// is required, so the half we shipped was doing nothing at all.
//
// The guard is derived rather than listed, for the same reason as the link
// guard above: a page added to one tree and not the other is exactly the
// mistake, so a hand-maintained list would go stale the same way. /no/checkout
// and /no/feedback annotate on neither side deliberately (noindex utility
// pages), and this test asks only that the two sides agree.
describe('hreflang return links', () => {
  const EN_ROOT = join(process.cwd(), 'app', '(en)');
  const NO_ROOT = join(process.cwd(), 'app', '(no)', 'no');

  /**
   * Every page.tsx under a tree root, as its URL route ('product/[slug]', ''
   * for the root page) and its folder on disk, which differ when the page sits
   * in a route group: /products is app/(en)/(shop)/products.
   */
  const pagesUnder = (dir: string, route = '', folder = ''): { route: string; folder: string }[] =>
    readdirSync(dir).flatMap(entry => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        const nextFolder = folder ? `${folder}/${entry}` : entry;
        if (isRouteGroup(entry)) return pagesUnder(full, route, nextFolder);
        return pagesUnder(full, route ? `${route}/${entry}` : entry, nextFolder);
      }
      return entry === 'page.tsx' ? [{ route, folder }] : [];
    });

  const declaresPair = (root: string, folder: string) =>
    readFileSync(join(root, folder, 'page.tsx'), 'utf8').includes('hreflangPair(');

  /** The English page for a route, wherever its folder sits. */
  const enPages = new Map(pagesUnder(EN_ROOT).map(p => [p.route, p.folder]));

  it('gives every Norwegian page that declares a pair an English twin that declares one back', () => {
    const offenders: string[] = [];
    for (const { route, folder } of pagesUnder(NO_ROOT)) {
      if (!declaresPair(NO_ROOT, folder)) continue;
      const enFolder = enPages.get(route);
      if (enFolder === undefined) {
        offenders.push(`/no/${route} has no English twin under app/(en)`);
      } else if (!declaresPair(EN_ROOT, enFolder)) {
        offenders.push(`/${route} declares hreflang under /no and app/(en)/${enFolder}/page.tsx does not answer`);
      }
    }
    expect(
      offenders,
      `Norwegian pages annotate an English twin that never links back, so Google discards the pair:\n${offenders.join('\n')}`
    ).toEqual([]);
  });

  // The guard above passes vacuously if it stops finding pages, so pin that it
  // still sees the shop pages through their route group on both sides.
  it('finds the pages inside route groups', () => {
    for (const route of ['products', 'category/[slug]', 'collection/[slug]']) {
      expect(enPages.get(route), `app/(en) ${route}`).toBe(`(shop)/${route}`);
      expect(pagesUnder(NO_ROOT).some(p => p.route === route), `app/(no)/no ${route}`).toBe(true);
    }
  });

  it('keeps the annotation off the pages that deliberately have none on either side', () => {
    for (const route of ['checkout', 'feedback']) {
      expect(declaresPair(NO_ROOT, route), `/no/${route} should not annotate`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Every browsing page under /no must be reachable from its English twin.
// The redirect policy is separate, so a new translation cannot silently
// widen first-visit redirects or disappear from the language switch.
describe('noPathFor knows about every Norwegian page', () => {
  const APP_NO = join(process.cwd(), 'app', '(no)', 'no');

  // Mid-payment language changes remain separately scoped. The order
  // confirmation follows checkout: it shows the order just placed in this tab,
  // in the language it was placed in, and is not a page to browse between.
  const KNOWN_GAPS = new Set(['/checkout', '/order-confirmed']);

  /** English paths of every STATIC page under app/(no)/no. */
  const norwegianPages = (dir: string, prefix = ''): string[] =>
    readdirSync(dir).flatMap(entry => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        // Dynamic segments are covered by the pattern tests above.
        if (entry.startsWith('[')) return [];
        return norwegianPages(full, isRouteGroup(entry) ? prefix : `${prefix}/${entry}`);
      }
      return entry === 'page.tsx' ? [prefix || '/'] : [];
    });

  it('maps every static Norwegian page back from its English path', () => {
    const missing = norwegianPages(APP_NO)
      .filter(en => !KNOWN_GAPS.has(en))
      .filter(en => noPathFor(en) !== (en === '/' ? '/no' : `/no${en}`));

    expect(
      missing,
      `These /no pages exist but noPathFor cannot reach them, so the language control offers nothing on the English page:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('still maps the artist pages that this guard was written for', () => {
    expect(noPathFor('/artists')).toBe('/no/artists');
    expect(noPathFor('/artists/apply')).toBe('/no/artists/apply');
    expect(noPathFor('/artists/how-it-works')).toBe('/no/artists/how-it-works');
  });
});
