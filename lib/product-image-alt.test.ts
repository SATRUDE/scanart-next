import { describe, expect, it } from 'vitest';

import { printImageAlt, productImages, sceneImageAlt } from '@/lib/product-image-alt';

const birdieBrown = {
  name: 'Birdie Brown',
  artist: 'Renate Thor',
  category: 'Abstract',
  image: '/images/products/birdie-brown.png',
  secondaryImage: '/images/products/birdie-brown-scene.avif',
};

describe('printImageAlt', () => {
  it('names the work, the artist and the kind of print', () => {
    expect(printImageAlt(birdieBrown)).toBe(
      'Birdie Brown by Renate Thor, an abstract Scandinavian art print'
    );
  });

  it('reads the plural category noun as an adjective', () => {
    expect(
      printImageAlt({ name: 'Swallow Dive', artist: 'Simen Wahlqvist', category: 'Illustrations' })
    ).toBe('Swallow Dive by Simen Wahlqvist, an illustrated Scandinavian art print');
  });

  it('picks the right indefinite article for a consonant', () => {
    expect(
      printImageAlt({ name: 'Trysilkaffe', artist: 'Ingunn Dybendal', category: 'Botanical' })
    ).toBe('Trysilkaffe by Ingunn Dybendal, a botanical Scandinavian art print');
  });

  it('falls back to brand when there is no artist', () => {
    expect(printImageAlt({ name: 'Untitled', brand: 'Scandinavian Art', category: 'Abstract' })).toBe(
      'Untitled by Scandinavian Art, an abstract Scandinavian art print'
    );
  });

  it('drops the attribution when neither artist nor brand is set', () => {
    expect(printImageAlt({ name: 'Untitled', category: 'Abstract' })).toBe(
      'Untitled, an abstract Scandinavian art print'
    );
  });

  it('drops the adjective for a category it does not recognise', () => {
    expect(printImageAlt({ name: 'Untitled', artist: 'Renate Thor', category: 'Sculpture' })).toBe(
      'Untitled by Renate Thor, a Scandinavian art print'
    );
  });

  it('never leaks the positional wording it replaced', () => {
    expect(printImageAlt(birdieBrown)).not.toMatch(/Image \d/);
  });
});

describe('sceneImageAlt', () => {
  it('says the print is styled in a room rather than shown on its own', () => {
    expect(sceneImageAlt(birdieBrown)).toBe(
      'Birdie Brown by Renate Thor, framed and styled in a room setting'
    );
  });
});

describe('productImages', () => {
  it('returns the print then the scene, each with its own alt', () => {
    expect(productImages(birdieBrown)).toEqual([
      {
        src: '/images/products/birdie-brown.png',
        alt: 'Birdie Brown by Renate Thor, an abstract Scandinavian art print',
      },
      {
        src: '/images/products/birdie-brown-scene.avif',
        alt: 'Birdie Brown by Renate Thor, framed and styled in a room setting',
      },
    ]);
  });

  it('omits a missing secondary image', () => {
    expect(productImages({ ...birdieBrown, secondaryImage: '' })).toHaveLength(1);
  });

  it('omits a secondary image that merely repeats the print', () => {
    expect(
      productImages({ ...birdieBrown, secondaryImage: '/images/products/birdie-brown.png' })
    ).toHaveLength(1);
  });
});
