import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ProductImageGalleryWrapper } from '@/components/ProductImageGalleryWrapper';

vi.mock('next/navigation', () => ({ usePathname: () => '/product/through-the-willows' }));
vi.mock('@/components/v2/product/ProductVideo', () => ({ ProductVideo: () => React.createElement('div') }));

const images = [
  { src: '/images/products/through-the-willows.png', alt: 'The print' },
  { src: '/images/products/through-the-willows-room.avif', alt: 'The room' },
];
const roomSizeCaption = { src: images[1].src, text: 'Room image: 50 × 70 cm print, shown framed.' };

describe('gallery room-size caption', () => {
  it('appears beneath the visible desktop room image', () => {
    const html = renderToStaticMarkup(React.createElement(ProductImageGalleryWrapper, {
      images, productName: 'Through the Willows', roomSizeCaption,
    }));
    expect(html).toContain(roomSizeCaption.text);
  });

  it('does not label a video that occupies the desktop room-image slot', () => {
    const html = renderToStaticMarkup(React.createElement(ProductImageGalleryWrapper, {
      images, productName: 'Through the Willows', roomSizeCaption,
      video: { av1: '/video/room.av1.mp4', h264: '/video/room.mp4', poster: '/video/room.jpg', objectPosition: '50% 50%', label: { en: 'Video', no: 'Video' } },
    }));
    expect(html).not.toContain(roomSizeCaption.text);
  });
});
