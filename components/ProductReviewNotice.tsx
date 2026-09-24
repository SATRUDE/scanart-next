import Link from 'next/link';
import type { Product } from '@/contexts/CartContext';

export function ProductReviewNotice({ product, locale = 'en' }: { product: Product; locale?: 'en' | 'no' }) {
  if (product.published !== false) return null;
  const notes = Array.isArray(product.reviewNotes) ? product.reviewNotes : product.reviewNotes ? [product.reviewNotes] : [];
  return (
    <aside className="space-y-2 rounded border border-amber-200 bg-amber-50 p-4 text-sm">
      <h2 className="font-medium">{locale === 'no' ? 'Forhåndsvisning · Ikke publisert' : 'Preview · Not published'}</h2>
      <p>{locale === 'no' ? 'Priser og størrelser er forslag til gjennomgang. Kjøp er deaktivert.' : 'Prices and sizes are proposed for review. Purchasing is disabled.'}</p>
      {notes.map((note, index) => <p key={index}>{note}</p>)}
      <Link className="inline-block underline" href={`/catalogue-preview/product/${product.slug}${locale === 'no' ? '?lang=no' : ''}`}>
        {locale === 'no' ? 'Se motivet uten ramme og merknader' : 'View unframed artwork and review notes'}
      </Link>
    </aside>
  );
}
