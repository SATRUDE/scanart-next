import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';

vi.mock('next/navigation', () => ({ usePathname: () => '/product/through-the-willows' }));

const images = [
  { src: '/images/products/through-the-willows.png', alt: 'The print' },
  { src: '/images/products/through-the-willows-room.avif', alt: 'The room' },
];
describe('product gallery copy', () => {
  it('keeps the room image and swipe count without a room-size caption', () => {
    const html = renderToStaticMarkup(React.createElement(ProductImageGalleryWrapper, {
      images, productName: 'Through the Willows',
    }));
    expect(html).toContain('The room');
    expect(html).toContain('1 / 2');
    expect(html).not.toMatch(/Room image:|Interiørbilde:/);
  });
});
