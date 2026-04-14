'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SmartImage } from '@/components/SmartImage';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLowestProductPrices } from '@/lib/pricing';
import { Product } from '@/contexts/CartContext';

interface HeroSectionProps {
  products: Product[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ products }) => {
  const { formatPrice } = useLanguage();
  const heroProducts = products.slice(0, 3);

  return (
    <div className="flex flex-col lg:flex-row bg-white">
      <div className="lg:w-1/2 lg:sticky lg:top-0 lg:self-start min-h-screen flex flex-col justify-center p-8 lg:p-16">
        <div className="max-w-lg space-y-8">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-muted rounded-full">Started in Norway</span>
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl leading-tight text-neutral-900 tracking-tight">
              Explore a curated collection of contemporary Scandinavian art
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Thoughtfully selected to showcase the diversity, depth, and beauty of the Nordic region
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/products">
              <Button size="lg">Shop Prints</Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="lg:w-1/2">
        <div className="space-y-8 p-8">
          {heroProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="relative cursor-pointer group max-w-2xl ml-auto block">
              <div className="bg-white rounded overflow-hidden border border-gray-100">
                <div className="aspect-[3/4] overflow-hidden">
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    secondarySrc={product.secondaryImage}
                    useSecondary={true}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>{product.artist || product.brand}</span>
                    <span>&bull;</span>
                    <span>{product.category}</span>
                  </div>
                  <h3 className="text-lg mb-3">{product.name}</h3>
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
