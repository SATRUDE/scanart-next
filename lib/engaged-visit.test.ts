import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENGAGED_VISIBLE_MS, createEngagedVisit, noteGalleryOpened, productKey, resetEngagedVisitForTest, startEngagedVisit } from './engaged-visit';

beforeEach(() => { vi.useFakeTimers(); resetEngagedVisitForTest(); });
afterEach(() => { vi.useRealTimers(); resetEngagedVisitForTest(); });

describe('productKey', () => {
  it('recognises English and Norwegian product pages as the same product', () => {
    expect(productKey('/product/vinkveld')).toBe('vinkveld');
    expect(productKey('/no/product/Vinkveld')).toBe('vinkveld');
    expect(productKey('/product/vinkveld/')).toBe('vinkveld');
  });
  it('ignores everything else', () => {
    for (const p of ['/', '/products', '/no', '/category/product/x', '/product/', '/checkout']) expect(productKey(p)).toBeNull();
  });
});

describe('engaged visit', () => {
  const make = () => { const fn = vi.fn(); return { fn, v: createEngagedVisit(fn) }; };

  it('fires gallery once', () => {
    const { fn, v } = make();
    v.galleryOpened(); v.galleryOpened();
    expect(fn.mock.calls).toEqual([['gallery']]);
  });

  it('fires second_product on a second distinct product, not on a repeat or non-product page', () => {
    const { fn, v } = make();
    v.pageView('/product/a'); v.pageView('/'); v.pageView('/product/a'); v.pageView('/no/product/a');
    expect(fn).not.toHaveBeenCalled();
    v.pageView('/product/b');
    expect(fn.mock.calls).toEqual([['second_product']]);
    v.pageView('/product/c');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fires time_60s after 60 seconds of visible time', () => {
    const { fn, v } = make();
    v.setVisible(true);
    vi.advanceTimersByTime(ENGAGED_VISIBLE_MS - 1);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn.mock.calls).toEqual([['time_60s']]);
  });

  it('pauses while hidden', () => {
    const { fn, v } = make();
    v.setVisible(true);
    vi.advanceTimersByTime(40_000);
    v.setVisible(false);
    vi.advanceTimersByTime(10 * 60_000);
    expect(fn).not.toHaveBeenCalled();
    v.setVisible(true);
    vi.advanceTimersByTime(19_999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn.mock.calls).toEqual([['time_60s']]);
  });

  it('never fires twice and stops the timer once engaged', () => {
    const { fn, v } = make();
    v.setVisible(true);
    v.galleryOpened();
    vi.advanceTimersByTime(5 * 60_000);
    v.pageView('/product/a'); v.pageView('/product/b'); v.setVisible(true);
    expect(fn.mock.calls).toEqual([['gallery']]);
    expect(v.engaged).toBe(true);
  });

  it('a throwing handler does not escape', () => {
    const v = createEngagedVisit(() => { throw new Error('x'); });
    expect(() => v.galleryOpened()).not.toThrow();
  });
});

describe('page-session singleton', () => {
  it('routes the gallery to the started visit, and is a no-op before it starts', () => {
    const fn = vi.fn();
    noteGalleryOpened();
    startEngagedVisit(fn);
    noteGalleryOpened(); noteGalleryOpened();
    expect(fn.mock.calls).toEqual([['gallery']]);
  });
});
