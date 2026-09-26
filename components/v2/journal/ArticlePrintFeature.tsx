import Image from 'next/image';
import { Button, Meta } from '@/components/v2/ui';
import { Price } from '@/components/v2/home/Price';
import { printImageAlt } from '@/lib/product-image-alt';
import type { PrintFeatureData } from '@/lib/article-prints';
import { no } from '@/lib/i18n/no';

const STRINGS = {
  en: { seePrint: 'See the print' },
  no: no.journal.article,
} as const;

/**
 * Print feature (Figma Article 194:6030 / mobile 194:6181), written in an
 * article body as `::print[slug]`. The data is the published catalogue's,
 * attached on the server by lib/article-prints.ts; nothing here is typed by
 * the writer. No server-only imports, so the preview route's ReaderComments
 * (a client component) can render it too.
 *
 * The image is the warm standard shot at the print's own ratio, as on every
 * print tile, so the whole print is always in view.
 */
export function ArticlePrintFeature({
  print,
  locale = 'en',
  className = '',
}: {
  print: PrintFeatureData;
  locale?: 'en' | 'no';
  className?: string;
}) {
  const t = STRINGS[locale];
  const href = `${locale === 'no' ? '/no' : ''}/product/${print.slug}`;
  return (
    <div className={className}>
      {/* The image links too, but only the button is in the tab order and the
          accessibility tree, so the print is one stop, not two. */}
      <a href={href} tabIndex={-1} aria-hidden className={`${print.aspect} relative block w-full overflow-hidden bg-image-bg`}>
        <Image
          src={print.image}
          alt={printImageAlt({ name: print.name, artist: print.artist, brand: print.brand, category: print.category }, locale)}
          fill
          sizes="(max-width: 833px) 100vw, (max-width: 1199px) 75vw, 624px"
          className="object-cover"
        />
      </a>
      {/* Mobile: name and price, then artist and size, then the button.
          From tablet: under a rule, name and meta left, price and button right. */}
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-x-6 tab:mt-6 tab:grid-cols-[1fr_auto_auto] tab:border-t tab:border-ink tab:pt-6">
        <p className="type-h3 tab:col-start-1 tab:row-start-1">{print.name}</p>
        <p className="type-body tab:col-start-2 tab:row-span-2 tab:row-start-1">
          <Price product={print} />
        </p>
        <p className="col-span-2 mt-3 type-small tab:col-span-1 tab:col-start-1 tab:row-start-2 tab:mt-1 tab:type-caption">
          <Meta items={[print.artist ?? print.brand, print.sizeLabel]} />
        </p>
        <Button
          href={href}
          className="col-span-2 mt-3 justify-self-start tab:col-span-1 tab:col-start-3 tab:row-span-2 tab:row-start-1 tab:mt-0"
        >
          {t.seePrint}
          <span className="sr-only-sa">: {print.name}</span>
        </Button>
      </div>
    </div>
  );
}
