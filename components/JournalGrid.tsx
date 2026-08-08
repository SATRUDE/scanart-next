'use client';

import { track } from '@/lib/analytics';

import React, { useState, useMemo, useEffect } from 'react';
import { Article } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';

interface JournalGridProps {
  articles: Article[];
  categories: string[];
}

export const JournalGrid: React.FC<JournalGridProps> = ({ articles, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-neutral-900 mb-2">Journal</h1>
        <p className="text-muted-foreground">{filteredArticles.length} articles</p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                track('journal-filter-click', { category: cat });
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-neutral-700 hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* The first card only: the grid is one column on mobile, which is the
            viewport Google measures, so card 0 is the LCP element there and the
            top-left card on wider screens. Preloading more than one would give
            the browser competing LCP candidates, which the next/image docs warn
            against. */}
        {filteredArticles.map((article, index) => (
          <ArticleCard key={article.id} article={article} titleAs="h2" priority={index === 0} />
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No articles yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
};
