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
  const tags = [...new Set(articles.flatMap(a => a.tags))].sort();

  return <JournalGrid articles={articles} tags={tags} />;
}
