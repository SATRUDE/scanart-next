import { describe, it, expect } from 'vitest';
import { scrollDepthPercent } from './scroll-depth';

describe('scrollDepthPercent', () => {
  it('reads an unscrollable page as fully seen', () => {
    expect(scrollDepthPercent(0, 500, 800)).toBe(100);
  });

  it('reports the proportion of the scrollable height', () => {
    expect(scrollDepthPercent(500, 1800, 800)).toBe(50);
  });

  it('never exceeds 100 when rubber-band scrolling overshoots', () => {
    expect(scrollDepthPercent(1100, 1800, 800)).toBe(100);
  });

  it('never goes below 0 when the overshoot is at the top', () => {
    expect(scrollDepthPercent(-40, 1800, 800)).toBe(0);
  });
});
