import type { Metadata } from 'next';
import { getAllArticles } from '@/lib/articles';
import { JournalGrid } from '@/components/JournalGrid';

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Read about Scandinavian art, Nordic design, and the artists behind our curated collection.',
  alternates: {
    canonical: '/journal',
  },
};

export default async function JournalPage() {
  const articles = await getAllArticles();
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))].sort();

  return <JournalGrid articles={articles} categories={categories} />;
}
