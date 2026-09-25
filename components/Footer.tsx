'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { track } from '@/lib/analytics';
import { chromeAria, enPathFor, footerStrings, isNoPath, noPathFor } from '@/lib/i18n';

interface FooterProps {
  /**
   * The year shown in the copyright line. The root layout passes the year it
   * renders in, so the line follows the calendar instead of being hand-edited;
   * the default only covers isolated renders such as Storybook.
   */
  year?: number;
}

type Season = 'winter' | 'spring' | 'summer' | 'autumn';
const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];

/**
 * Pale tint per season, measured from that season's footage so the wordmark
 * keeps 3:1 or better on it (brands/scandinavian-art/seasons/seasons.json).
 */
const TINT: Record<Season, string> = {
  winter: 'var(--sa-winter)',
  spring: 'var(--sa-spring)',
  summer: 'var(--sa-summer)',
  autumn: 'var(--sa-autumn)',
};

/** The season in Oslo right now: Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn. */
function currentSeason(date = new Date()): Season {
  const month = Number(new Intl.DateTimeFormat('en-GB', { month: 'numeric', timeZone: 'Europe/Oslo' }).format(date));
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

const STORAGE_KEY = 'sa-footer-season';

export const Footer: React.FC<FooterProps> = ({ year = new Date().getFullYear() }) => {
  // The Footer is mounted once in the root layout, which cannot know the
  // route, so the Norwegian tree is detected here: under /no the labels come
  // from the Norwegian chrome strings, and every link stays inside /no.
  // English pages take the English branch and render exactly as before.
  //
  // As of 2026-08-25 every destination in this footer has a Norwegian twin, so
  // there is no exception list left to keep. Articles are the one part of the
  // site with no /no version, and no link here points at one.
  //
  // The exception list is what rotted, twice. It was written in phase 1 when
  // wall art, shop all, privacy, terms, inspire, journal and feedback really
  // had no twin, and it went on sending Norwegian readers to English for weeks
  // after each of those pages shipped, because nothing failed when a twin
  // appeared. lib/i18n-no.test.ts now derives the answer from which page
  // directories exist under app/(no)/no and walks this file's hrefs, so the
  // next Norwegian page makes the suite fail until the links follow it.
  const pathname = usePathname();
  const isNo = isNoPath(pathname);
  const t = footerStrings[isNo ? 'no' : 'en'];
  const localeHrefPrefix = isNo ? '/no' : '';
  const aboutHref = isNo ? '/no/about' : '/about';
  const artistsHref = isNo ? '/no/artists' : '/artists';
  const helpHref = isNo ? '/no/help' : '/help';
  const deliveryHref = isNo ? '/no/delivery' : '/delivery';
  // Crawlable EN/NO pairing (the SEO fix): on an English page with a Norwegian
  // twin, link to it; on a Norwegian page, link back to the English original.
  const langSwitchHref = isNo ? enPathFor(pathname) : noPathFor(pathname);

  // The season is chosen by the visitor and remembered on this device. The
  // static HTML carries the season at build time; the effect corrects it to
  // today's season in Oslo (or the saved choice) straight after hydration.
  const [season, setSeason] = useState<Season>(() => currentSeason());
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Season | null;
      setSeason(saved && SEASONS.includes(saved) ? saved : currentSeason());
    } catch {
      setSeason(currentSeason());
    }
  }, []);
  const choose = (s: Season) => {
    setSeason(s);
    track('footer-season', { season: s });
    try {
      window.localStorage.setItem(STORAGE_KEY, s);
    } catch {
      // Private mode or blocked storage: the choice simply isn't remembered.
    }
  };

  // Every indexable landing, in the served HTML on every page. The V2 design
  // keeps the footer to two short stacks; these links carry the internal
  // linking the old footer did (docs/v2-seo.md), set quietly in caption type.
  const shopLinks = [
    ...categoryLandings.map(category => ({ href: `${localeHrefPrefix}/category/${category.slug}`, label: t.categoryLabels[category.slug] ?? category.category })),
    ...collections.map(collection => ({ href: `${localeHrefPrefix}/collection/${collection.slug}`, label: t.collectionLabels[collection.slug] ?? collection.chipLabel })),
    { href: `${localeHrefPrefix}/scandinavian-wall-art`, label: t.wallArt },
    // English only: /nordic-art has no Norwegian twin, so the link is guarded
    // the same way LandingCrossLinks guards it.
    ...(!isNo ? [{ href: '/nordic-art', label: t.nordicArt }] : []),
    { href: `${localeHrefPrefix}/products`, label: t.shopAll },
  ];

  const linkClass = 'transition-opacity hover:opacity-60';

  return (
    <footer
      className="transition-colors duration-[600ms] ease-out"
      style={{ backgroundColor: TINT[season] }}
    >
      <div className="page-x pt-band tab:pt-[96px]">
        <div className="flex flex-col gap-10 tab:flex-row tab:items-start tab:justify-between pb-10 tab:pb-band">
          <div role="group" aria-label={t.seasons.label} className="flex flex-col gap-1 tab:flex-row tab:items-center tab:gap-8">
            {SEASONS.map(s => (
              <button
                key={s}
                type="button"
                aria-pressed={season === s}
                onClick={() => choose(s)}
                className="type-h3 flex items-center gap-2 tab:gap-[10px] text-left cursor-pointer"
              >
                {season === s && <span aria-hidden className="hairline" />}
                {t.seasons[s]}
              </button>
            ))}
          </div>

          <nav aria-label={chromeAria[isNo ? 'no' : 'en'].landmarks.footer} className="flex gap-10 tab:gap-16 type-small">
            <ul className="flex flex-col gap-[6px] tab:gap-1">
              <li><Link href={`${localeHrefPrefix}/products`} className={linkClass}>{isNo ? 'Trykk' : 'Prints'}</Link></li>
              <li><Link href={`${localeHrefPrefix}/inspire`} className={linkClass}>{t.inspire}</Link></li>
              <li><Link href={artistsHref} className={linkClass}>{t.artists}</Link></li>
              <li><Link href={`${localeHrefPrefix}/journal`} className={linkClass}>{t.journal}</Link></li>
            </ul>
            <ul className="flex flex-col gap-[6px] tab:gap-1">
              <li><Link href={aboutHref} className={linkClass}>{t.about}</Link></li>
              <li><Link href={helpHref} className={linkClass}>{t.help}</Link></li>
              <li><a href="https://www.instagram.com/helloscandinavianart/" target="_blank" rel="noopener noreferrer" className={linkClass}>Instagram</a></li>
              <li><a href="mailto:hello@scandinavianart.co.uk" className={linkClass}>hello@scandinavianart.co.uk</a></li>
            </ul>
          </nav>
        </div>

        {/* The wordmark carries the season's footage inside the letters. A
            still for now; the looping video version is in
            brands/scandinavian-art/footer-motion.md. Decorative: the brand
            name is already the header's home link. */}
        <div aria-hidden className="[container-type:inline-size] overflow-hidden">
          <p
            className="font-serif leading-none whitespace-nowrap text-transparent bg-clip-text bg-cover bg-center select-none text-[13.48cqw] tracking-[-0.03em] -ml-[0.01em] pb-[0.08em]"
            style={{ backgroundImage: `url(/images/v2/seasons/${season}.webp)` }}
          >
            Scandinavian Art
          </p>
        </div>

        <div className="pt-10 tab:pt-[96px] flex flex-col gap-3 type-caption">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{t.shopBy}</span>
            {shopLinks.map(link => (
              <Link key={link.href} href={link.href} className={linkClass}>{link.label}</Link>
            ))}
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href={deliveryHref} className={linkClass}>{t.delivery}</Link>
            <Link href={`${localeHrefPrefix}/privacy`} className={linkClass}>{t.privacy}</Link>
            <Link href={`${localeHrefPrefix}/terms`} className={linkClass}>{t.terms}</Link>
            {/* The intercept's permanent re-entry route: the corner card parks
                itself for 60 days on dismissal and that is per-device, so
                someone who said no and then hit the thing that annoyed them
                needs a door that is always there. */}
            <Link href={`${localeHrefPrefix}/feedback`} className={linkClass}>{t.feedback}</Link>
            <a href="https://www.facebook.com/people/Scandinavian-Art/61563171855842/" target="_blank" rel="noopener noreferrer" className={linkClass}>Facebook</a>
            {/* Painted door: the newsletter doesn't exist yet; counting presses
                on this deliberately inert button is the case for building it. */}
            <button type="button" onClick={() => track('newsletter-click')} className="opacity-50 cursor-not-allowed">{t.newsletter}</button>
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 pb-6 tab:pb-8 type-caption">
          <p>&copy; {year} Scandinavian Art</p>
          <div className="flex items-center gap-4">
            {langSwitchHref && (
              <Link href={langSwitchHref} lang={isNo ? 'en' : 'no'} className={linkClass}>
                {isNo ? 'Read in English' : 'Les på norsk'}
              </Link>
            )}
            <span className="flex items-center gap-[6px]">
              {isNo ? 'NO' : 'EN'} <span aria-hidden className="hairline" /> GBP
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
