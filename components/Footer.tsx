'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WordmarkVideo } from '@/components/v2/WordmarkVideo';
import { OPTION_PAD } from '@/components/v2/OptionTrack';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { track } from '@/lib/analytics';
import { chromeAria, footerStrings, isNoPath } from '@/lib/i18n';

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

/**
 * The season selector, in the same style as the product options: the brand
 * hairline in front of the chosen season (.option-mark): the old line shrinks
 * away and the new one grows in, with every season reserving its space so no
 * word moves.
 */
function SeasonPicker({ season, onChoose, labels }: { season: Season; onChoose: (s: Season) => void; labels: Record<Season, string> & { label: string } }) {
  return (
    <div role="group" aria-label={labels.label} className="flex flex-col gap-1 tab:flex-row tab:items-center tab:gap-8">
      <>
        {SEASONS.map(s => (
          <button
            key={s}
            type="button"
            data-option={s}
            aria-pressed={season === s}
            onClick={() => onChoose(s)}
            className={`relative type-h3 ${OPTION_PAD} text-left transition-opacity duration-200 hover:opacity-60 aria-pressed:hover:opacity-100`}
          >
            <span aria-hidden className="option-mark" />
            {labels[s]}
          </button>
        ))}
      </>
    </div>
  );
}

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
  // The visible "Les på norsk" / "Read in English" link was removed on Mark's
  // call (2026-09-26): the language switcher does that job for people. For
  // search, every EN/NO pair still declares the other through hreflang in the
  // head and alternates in the sitemap, which is Google's own mechanism.

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
  // Wordmark layers are mounted once a season has been shown, so the footage
  // crossfades instead of snapping and unseen seasons cost nothing.
  const [seen, setSeen] = useState<Set<Season>>(() => new Set([currentSeason()]));
  useEffect(() => { setSeen(prev => (prev.has(season) ? prev : new Set(prev).add(season))); }, [season]);

  // The footage in the wordmark (WordmarkVideo): the still shows until the
  // video is drawing, and the visitor can stop the motion (remembered).
  const wordmarkText = useRef<HTMLParagraphElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const onVideoReady = useCallback((ready: boolean) => setVideoReady(ready), []);
  const [motionOff, setMotionOff] = useState(false);
  useEffect(() => {
    try {
      setMotionOff(window.localStorage.getItem('sa-footer-motion') === 'off');
    } catch {
      // Storage blocked: motion stays on by default.
    }
  }, []);
  const toggleMotion = () => {
    const next = !motionOff;
    setMotionOff(next);
    track('footer-motion', { on: !next });
    try {
      window.localStorage.setItem('sa-footer-motion', next ? 'off' : 'on');
    } catch {
      // Not remembered, which is fine.
    }
  };

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
        <div className="flex flex-col gap-10 desk:flex-row desk:items-start desk:justify-between pb-10 tab:pb-band">
          <SeasonPicker season={season} onChoose={choose} labels={t.seasons} />

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
        <div aria-hidden className="relative [container-type:inline-size] overflow-hidden">
          {SEASONS.filter(s => seen.has(s)).map((s, i) => (
            <p
              key={s}
              ref={i === 0 ? wordmarkText : undefined}
              className={`font-serif leading-none whitespace-nowrap text-transparent bg-clip-text bg-cover bg-center select-none text-[13.48cqw] tracking-[-0.03em] -ml-[0.01em] pb-[0.08em] transition-opacity duration-700 ease-out ${i === 0 ? 'relative' : 'absolute inset-0'} ${season === s && !videoReady ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url(/images/v2/seasons/${s}.webp)` }}
            >
              Scandinavian Art
            </p>
          ))}
          <div className={`transition-opacity duration-700 ease-out ${videoReady ? 'opacity-100' : 'opacity-0'}`}>
            <WordmarkVideo season={season} textRef={wordmarkText} paused={motionOff} onReady={onVideoReady} />
          </div>
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
            {/* Attribution for the Wikimedia Commons footage in the wordmark
                above and the About photographs (lib/credits.ts). */}
            <Link href={`${localeHrefPrefix}/credits`} className={linkClass}>{t.credits}</Link>
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
            <button type="button" onClick={toggleMotion} aria-pressed={motionOff} className="transition-opacity hover:opacity-60 motion-reduce:hidden">
              {motionOff ? t.motion.play : t.motion.pause}
            </button>
            <span className="flex items-center gap-[6px]">
              {isNo ? 'NO' : 'EN'} <span aria-hidden className="hairline" /> GBP
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
