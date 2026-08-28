'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ResponsiveText } from '@/components/ResponsiveText';
import { categoryLandings } from '@/lib/categories';
import { collections } from '@/lib/collections';
import { track } from '@/lib/analytics';
import { enPathFor, footerStrings, isNoPath, noPathFor } from '@/lib/i18n';

interface FooterProps {
  /**
   * The year shown in the copyright line. The root layout passes the year it
   * renders in, so the line follows the calendar instead of being hand-edited;
   * the default only covers isolated renders such as Storybook.
   */
  year?: number;
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
  // Crawlable EN/NO pairing (the SEO fix): on an English page with a Norwegian
  // twin, link to it; on a Norwegian page, link back to the English original.
  // A plain footer link, not the header language switch — that stays a Stan
  // brief per the no-invented-design-language rule.
  const langSwitchHref = isNo ? enPathFor(pathname) : noPathFor(pathname);

  return (
    <footer className="bg-neutral-100 py-16">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8 mb-16">
          <div className="lg:col-span-2">
            <p className="text-2xl text-neutral-900 leading-relaxed">
              {t.tagline}
            </p>
          </div>
          <div>
            <ul className="text-sm text-neutral-900 space-y-2">
              {categoryLandings.map(category => (
                <li key={category.slug}>
                  <Link href={`${localeHrefPrefix}/category/${category.slug}`} className="hover:text-neutral-600 transition-colors">{t.categoryLabels[category.slug] ?? category.category}</Link>
                </li>
              ))}
              {collections.map(collection => (
                <li key={collection.slug}>
                  <Link href={`${localeHrefPrefix}/collection/${collection.slug}`} className="hover:text-neutral-600 transition-colors">{t.collectionLabels[collection.slug] ?? collection.chipLabel}</Link>
                </li>
              ))}
              <li>
                <Link href={`${localeHrefPrefix}/scandinavian-wall-art`} className="hover:text-neutral-600 transition-colors">{t.wallArt}</Link>
              </li>
              {/* English only: /nordic-art has no Norwegian twin, so the link is
                  guarded the same way LandingCrossLinks guards it. The wall-art
                  landing above has been in this list since it shipped and is in
                  the index; this one had links from nine pages in all, the ones
                  that render LandingCrossLinks, which is what a landing page
                  built to own a query family cannot run on. */}
              {!isNo && (
                <li>
                  <Link href="/nordic-art" className="hover:text-neutral-600 transition-colors">{t.nordicArt}</Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <ul className="text-sm text-neutral-900 space-y-2">
              <li><Link href={aboutHref} className="hover:text-neutral-600 transition-colors">{t.about}</Link></li>
              <li><Link href={`${localeHrefPrefix}/inspire`} className="hover:text-neutral-600 transition-colors">{t.inspire}</Link></li>
              <li><Link href={`${localeHrefPrefix}/journal`} className="hover:text-neutral-600 transition-colors">{t.journal}</Link></li>
              <li><Link href={artistsHref} className="hover:text-neutral-600 transition-colors">{t.artists}</Link></li>
              <li><Link href={helpHref} className="hover:text-neutral-600 transition-colors">{t.help}</Link></li>
              {/* The intercept's permanent re-entry route: the corner card parks
                  itself for 60 days on dismissal and that is per-device, so
                  someone who said no and then hit the thing that annoyed them
                  needs a door that is always there. */}
              <li><Link href={`${localeHrefPrefix}/feedback`} className="hover:text-neutral-600 transition-colors">{t.feedback}</Link></li>
              <li>
                {/* Painted door: the newsletter doesn't exist yet; counting presses
                    on this deliberately inert button is the case for building it. */}
                <button onClick={() => track('newsletter-click')} className="text-neutral-400 cursor-not-allowed opacity-50">{t.newsletter}</button>
              </li>
              <li><Link href={`${localeHrefPrefix}/products`} className="hover:text-neutral-600 transition-colors">{t.shopAll}</Link></li>
            </ul>
          </div>
          <div>
            <ul className="text-sm text-neutral-900 space-y-2">
              <li><a href="mailto:hello@scandinavianart.co.uk" className="hover:text-neutral-600 transition-colors">{t.sendEmail}</a></li>
              <li><a href="https://www.instagram.com/helloscandinavianart/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600 transition-colors">Instagram</a></li>
              <li><a href="https://www.facebook.com/people/Scandinavian-Art/61563171855842/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-600 transition-colors">Facebook</a></li>
            </ul>
          </div>
          <div>
            <ul className="text-sm text-neutral-900 space-y-2">
              <li><Link href={`${localeHrefPrefix}/privacy`} className="hover:text-neutral-600 transition-colors">{t.privacy}</Link></li>
              <li><Link href={`${localeHrefPrefix}/terms`} className="hover:text-neutral-600 transition-colors">{t.terms}</Link></li>
              <li><Link href={deliveryHref} className="hover:text-neutral-600 transition-colors">{t.delivery}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mb-16">
          <ResponsiveText text="SCANDINAVIAN ART" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-neutral-900">Copyright &copy; {year} SCANDINAVIAN ART</p>
          {langSwitchHref && (
            <Link
              href={langSwitchHref}
              className="text-sm text-neutral-600 underline hover:text-neutral-900 transition-colors"
            >
              {isNo ? 'Read in English' : 'Les på norsk'}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
};
