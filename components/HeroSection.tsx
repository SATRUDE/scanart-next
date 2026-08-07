'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SmartImage } from '@/components/SmartImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLowestProductPrices } from '@/lib/pricing';
import { Product } from '@/contexts/CartContext';
import type { HeroStrings } from '@/lib/i18n';

// English defaults so existing callers render identically with no props.
const DEFAULT_STRINGS: HeroStrings = {
  badge: 'Started in Norway',
  heading: 'Explore a curated collection of contemporary Scandinavian art',
  sub: 'Thoughtfully selected to showcase the diversity, depth, and beauty of the Nordic region',
  cta: 'Shop Prints',
};

interface HeroSectionProps {
  products: Product[];
  /** Localised copy; defaults to the English strings. */
  strings?: HeroStrings;
  /** Catalogue category value -> visible label (e.g. Norwegian names). */
  categoryLabels?: Record<string, string>;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  products,
  strings = DEFAULT_STRINGS,
  categoryLabels = {},
}) => {
  const { formatPrice } = useLanguage();
  const heroProducts = products.slice(0, 3);

  return (
    <div className="flex flex-col lg:flex-row bg-white">
      <div className="lg:w-1/2 lg:sticky lg:top-0 lg:self-start min-h-screen flex flex-col justify-center p-8 lg:p-16">
        <div className="max-w-lg space-y-8">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-muted rounded-full">{strings.badge}</span>
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl leading-tight text-neutral-900 tracking-tight">
              {strings.heading}
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              {strings.sub}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products">
              <Button size="lg">{strings.cta}</Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="lg:w-1/2">
        <div className="space-y-8 p-8">
          {heroProducts.map((product, index) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="relative cursor-pointer group max-w-2xl ml-auto block">
              <div className="bg-white rounded overflow-hidden border border-gray-100">
                <div className="aspect-[3/4] overflow-hidden">
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    secondarySrc={product.secondaryImage}
                    useSecondary={true}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>{product.artist || product.brand}</span>
                    <span>&bull;</span>
                    <span>{categoryLabels[product.category] ?? product.category}</span>
                  </div>
                  <p className="text-lg mb-3">{product.name}</p>
                  <div>
                    <span className="text-xl">{formatPrice(getLowestProductPrices(product))}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
