'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/articles';

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
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArticles.map(article => (
          <Link key={article.id} href={`/article/${article.slug}`} className="group">
            {article.image && (
              <div className="aspect-[4/3] overflow-hidden bg-neutral-50 rounded mb-4">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
                />
              </div>
            )}
            <div className="space-y-2">
              {article.category && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{article.category}</span>
              )}
              <h2 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
              )}
            </div>
          </Link>
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
