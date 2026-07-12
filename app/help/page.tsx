import type { Metadata } from 'next';
import Link from 'next/link';
import { helpGroups } from '@/data/help';
import { HelpSections } from '@/components/HelpSections';

export const metadata: Metadata = {
  title: 'Help',
  description: 'Answers to common questions about ordering, delivery, returns and our prints at Scandinavian Art.',
  alternates: { canonical: '/help' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: helpGroups.flatMap(group =>
    group.items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

export default function HelpPage() {
  return (
    <div className="py-8">
      <div className="container mx-auto px-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-normal text-neutral-900">Help</h1>
          <p className="text-lg text-neutral-600 leading-relaxed mt-2">
            Everything you need to know about ordering, delivery and returns. If you can&apos;t find your answer here,
            email us and we&apos;ll be glad to help.
          </p>
        </div>
      </div>

      <HelpSections />

      <div className="container mx-auto px-8 pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t pt-10">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-normal text-neutral-900">Still need help?</h2>
          </div>
          <div className="lg:col-span-2 space-y-3">
            <p className="text-muted-foreground">
              Email us at{' '}
              <a href="mailto:hello@scandinavianart.co.uk" className="text-neutral-900 hover:text-neutral-600 transition-colors">hello@scandinavianart.co.uk</a>{' '}
              and we&apos;ll be glad to help. You&apos;ll also find us on Instagram and Facebook.
            </p>
            <p className="text-sm text-neutral-900">
              See also{' '}
              <Link href="/delivery" className="hover:text-neutral-600 transition-colors">Delivery &amp; Returns</Link>{' · '}
              <Link href="/terms" className="hover:text-neutral-600 transition-colors">Terms &amp; Conditions</Link>{' · '}
              <Link href="/privacy" className="hover:text-neutral-600 transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
