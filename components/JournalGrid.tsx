'use client';

import { track } from '@/lib/analytics';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { JournalStrings } from '@/lib/i18n';
import { Article } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';
import { Hairline, Meta } from '@/components/v2/ui';
import { StoryRow } from '@/components/v2/journal/StoryRow';

const EN: JournalStrings = {
  heading: 'Journal',
  allChip: 'All stories',
  articlesSuffix: 'stories',
  empty: 'No articles yet. Check back soon.',
  booksSeriesHeading: 'The Nordic books series',
  startHere: '(start here)',
  categoryLabels: { Guide: 'Guides' },
  moreToReadHeading: 'More to read',
  moreToReadIntro: 'Guides, books and exhibitions, newest first.',
  readTheStory: 'Read the story',
  minRead: '{n} min read',
  dateLocale: 'en',
};

/** Stories shown as tiles under the featured one; the rest are ruled rows. */
const TILE_COUNT = 9;

/**
 * Story tile ratios (layout.md rule 13): equal columns, each image at its own
 * ratio, and every column holding one of each so all three end on one line.
 * Tile i sits in column floor(i / 3), row i % 3, and takes ratio (row + col) % 3,
 * which is the Figma frame's arrangement (2:3, 1:1, 4:5 down the first column).
 * Mobile is one column of 4:5 tiles.
 */
const RATIOS = ['tab:aspect-[2/3]', 'tab:aspect-square', 'tab:aspect-[4/5]'];

export interface JournalStoryMeta {
  /** Formatted publish date, in the page's language. */
  date: string;
  /** Read time in whole minutes. */
  minutes: number;
}

interface JournalGridProps {
  articles: Article[];
  categories: string[];
  /** Per-article date and read time, keyed by slug (computed on the server). */
  meta: Record<string, JournalStoryMeta>;
  /** Localised labels; defaults to the English strings above. */
  strings?: JournalStrings;
}

/**
 * The journal listing: Filter bar, the featured story (7 + 5), nine story
 * tiles in three continuous columns, then "More to read" as ruled rows
 * (Figma Journal 193:1240 / 194:1579).
 *
 * Every published article is in the served HTML as a crawlable link: the page
 * is prerendered with the filter on "All", so the featured story, the tiles and
 * the rows between them link all of them. The category filters are buttons
 * that only narrow what is shown after hydration.
 */
export const JournalGrid: React.FC<JournalGridProps> = ({ articles, categories, meta, strings }) => {
  const t = strings ?? EN;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const label = (cat: string) => t.categoryLabels?.[cat] ?? cat;
  // Tiles and rows show the category as the article names it ("Guide"); only
  // the filter reads as a plural where the page's labels say so.
  const tileLabel = (cat: string) => (t.dateLocale === 'no' ? label(cat) : cat);

  // Deep links (/journal?category=...) are applied after hydration rather than
  // via useSearchParams, which would opt the page out of static prerendering
  // and strip the article list from the served HTML.
  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from the URL after hydration; reading it during render would cause a server/client mismatch
    if (category && categories.includes(category)) setSelectedCategory(category);
  }, [categories]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'All') return articles;
    return articles.filter(a => a.category === selectedCategory);
  }, [articles, selectedCategory]);

  const [featured, ...others] = filteredArticles;
  const tiles = others.slice(0, TILE_COUNT);
  const rows = others.slice(TILE_COUNT);
  const perColumn = Math.ceil(tiles.length / 3);
  const columns = [0, 1, 2].map(c => tiles.slice(c * perColumn, (c + 1) * perColumn));

  return (
    <>
      {/* Filter bar 241:3763 (Journal labels): Options under a rule, the
          selected one with the hairline before it, the rest at 55% ink. */}
      {categories.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t border-ink pt-4 tab:mt-band tab:flex-row tab:items-center tab:justify-between tab:pt-6">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 tab:gap-x-6">
            {['All', ...categories].map(cat => {
              const selected = selectedCategory === cat;
              return (
                <li key={cat}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedCategory(cat);
                      track('journal-filter-click', { category: cat });
                    }}
                    className={`flex items-center gap-tight type-small transition-colors hover:text-brand ${selected ? '' : 'opacity-55 hover:opacity-100'}`}
                  >
                    {selected && <Hairline />}
                    <span>{cat === 'All' ? t.allChip : label(cat)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="type-small" aria-live="polite">
            {filteredArticles.length} {t.articlesSuffix}
          </p>
        </div>
      )}

      {featured && (
        // Featured story · 7 + 5. Its image is the page's one preload: on
        // mobile it is the first thing under the header, so it is the LCP
        // element there, and the top-left image on wider screens. Preloading
        // more than one would give the browser competing LCP candidates,
        // which the next/image docs warn against.
        <Link
          href={`/article/${featured.slug}`}
          className="group mt-8 page-grid gap-y-3 tab:mt-band"
        >
          {featured.image && (
            <div className="relative col-span-full aspect-square overflow-hidden bg-image-bg tab:col-span-4 desk:col-span-7 desk:aspect-[733/659]">
              <Image
                src={featured.image}
                alt={featured.imageAlt || featured.title}
                style={featured.image.includes('-room-') ? { objectPosition: 'center top' } : undefined}
                fill
                sizes="(max-width: 833px) 100vw, 58vw"
                preload
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
              />
            </div>
          )}
          <div className="col-span-full flex flex-col gap-3 tab:col-span-4 tab:gap-group tab:border-t tab:border-ink tab:pt-6 desk:col-span-5">
            {featured.category && <p className="type-caption text-text-accent">{tileLabel(featured.category)}</p>}
            <h2 className="type-h2 transition-colors group-hover:text-brand">{featured.title}</h2>
            {featured.excerpt && <p className="type-body">{featured.excerpt}</p>}
            {meta[featured.slug] && (
              <div className="hidden tab:block">
                <Meta
                  className="type-caption"
                  items={[meta[featured.slug].date, t.minRead.replace('{n}', String(meta[featured.slug].minutes))]}
                />
              </div>
            )}
            <span className="hidden type-body transition-colors group-hover:text-brand tab:block">{t.readTheStory}</span>
          </div>
        </Link>
      )}

      {tiles.length > 0 && (
        // Stories · 3 columns, continuous: each tile 64 under the one above,
        // no row gaps. DOM order is reading order down each column, so the
        // single mobile column needs no reordering.
        <div className="mt-10 flex flex-col gap-10 tab:mt-band tab:flex-row tab:gap-gutter">
          {columns.map((column, c) => (
            <div key={c} className="flex flex-1 flex-col gap-10 tab:min-w-0 tab:gap-band">
              {column.map((article, r) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  titleAs="h2"
                  imageAspectClass={`aspect-[4/5] ${RATIOS[(r + c) % 3]}`}
                  categoryLabel={article.category ? tileLabel(article.category) : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        // Reading list · 4 + 8: the heading and intro on 4 columns, the rows on 8.
        <section aria-labelledby="journal-more-to-read" className="mt-24 page-grid gap-y-0 desk:mt-32">
          <div className="col-span-full flex flex-col gap-group border-t border-ink pt-4 tab:pt-6 desk:col-span-4">
            <h2 id="journal-more-to-read" className="type-h2">{t.moreToReadHeading}</h2>
            <p className="hidden type-body desk:block">{t.moreToReadIntro}</p>
          </div>
          <ul className="col-span-full desk:col-span-8">
            {rows.map(article => (
              <StoryRow
                key={article.id}
                href={`/article/${article.slug}`}
                title={article.title}
                category={article.category ? tileLabel(article.category) : undefined}
                date={meta[article.slug]?.date}
                excerpt={article.excerpt}
                event="journal-row-click"
                eventData={{ to: `/article/${article.slug}` }}
              />
            ))}
          </ul>
        </section>
      )}

      {filteredArticles.length === 0 && (
        <p className="mt-band type-body">{t.empty}</p>
      )}
    </>
  );
};
