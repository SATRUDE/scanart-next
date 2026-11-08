'use client';

import Image from 'next/image';
import { Button } from '@/components/v2/ui';
import { useSalePromotion } from '@/contexts/SalePromotionContext';
import { salePromotionStrings } from '@/lib/sale-promotion';

/** Adapted from Figma Free delivery · sketches, promo card 490:2607.
 * Same type, tinted surface, spacing and Eye Nose Eye room crop. */
export function SalePromotion({ locale }: { locale: 'en' | 'no' }) {
  const active = useSalePromotion();
  if (!active) return null;
  const t = salePromotionStrings[locale];
  const prefix = locale === 'no' ? '/no' : '';

  return (
    <section aria-labelledby="sale-promotion" className="page-x mt-section" data-sale-promotion>
      <div className="flex flex-col bg-image-bg desk:flex-row desk:gap-gutter desk:p-10">
        <div className="relative order-1 aspect-[584/389] w-full overflow-hidden desk:order-2 desk:w-[calc((100%_-_var(--sa-gutter))_/_2)] desk:shrink-0">
          <Image
            src="/images/products/eye-nose-eye-room-chatgpt-2026-09-23.avif"
            alt={t.imageAlt}
            width={1122}
            height={1402}
            sizes="(min-width: 1200px) 42vw, 100vw"
            className="absolute left-0 top-[-3.75%] h-auto w-full max-w-none"
          />
        </div>
        <div className="order-2 flex min-w-0 flex-1 flex-col items-start justify-between gap-6 p-6 desk:order-1 desk:gap-8 desk:p-0">
          <div className="flex max-w-[480px] flex-col gap-3 tab:gap-4">
            <h2 id="sale-promotion" className="type-h3">{t.heading}</h2>
            <p className="type-small tab:type-body">{t.body}</p>
          </div>
          <div className="flex w-full flex-col gap-3 desk:w-auto desk:flex-row desk:flex-wrap desk:gap-4">
            <Button href={`${prefix}/products`}>{t.cta}</Button>
            <Button href={`${prefix}/delivery`} variant="secondary">{t.delivery}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
