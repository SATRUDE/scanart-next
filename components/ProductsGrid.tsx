'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLowestProductPrices } from '@/lib/pricing';
import { SmartImage } from '@/components/SmartImage';
import { getArtistById } from '@/data/artists';
import { Product } from '@/contexts/CartContext';

interface ProductsGridProps {
  products: Product[];
  categories: string[];
}

export const ProductsGrid: React.FC<ProductsGridProps> = ({ products, categories }) => {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('name');
  const { formatPrice } = useLanguage();

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    } else if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-low') {
        const aPrice = getLowestProductPrices(a).GBP || 0;
        const bPrice = getLowestProductPrices(b).GBP || 0;
        return aPrice - bPrice;
      }
      if (sortBy === 'price-high') {
        const aPrice = getLowestProductPrices(a).GBP || 0;
        const bPrice = getLowestProductPrices(b).GBP || 0;
        return bPrice - aPrice;
      }
      return 0;
    });
  }, [products, selectedCategory, sortBy, searchQuery]);

  return (
    <div>
      <div className="container mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">
            {searchQuery ? `Search: "${searchQuery}"` : 'All Artwork'}
          </h1>
          <p className="text-muted-foreground">{filteredProducts.length} prints</p>
        </div>

        {!searchQuery && (
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

        <div className="flex justify-end mb-6">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border rounded px-3 py-1.5"
          >
            <option value="name">Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-neutral-50 mb-4 rounded">
                <SmartImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{product.artistId ? getArtistById(product.artistId)?.name || product.brand : product.brand}</span>
                  <span>&bull;</span>
                  <span>{product.category}</span>
                </div>
                <h3 className="text-sm text-neutral-900">{product.name}</h3>
                <p className="text-sm text-neutral-900">
                  {formatPrice(getLowestProductPrices(product))}
                </p>
                {!product.inStock && <p className="text-xs text-neutral-400">Out of stock</p>}
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No products found</p>
            <Link href="/products" className="text-primary hover:underline">View all products</Link>
          </div>
        )}
      </div>
    </div>
  );
};
