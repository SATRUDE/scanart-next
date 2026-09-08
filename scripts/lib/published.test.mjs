import { describe, expect, it } from 'vitest';

import { isPublished } from './published.mjs';

describe('isPublished', () => {
  it('is true only for a PUBLISHED row', () => {
    expect(isPublished({ status: 'PUBLISHED' })).toBe(true);
  });

  it('is false for a draft or any other status', () => {
    expect(isPublished({ status: 'DRAFT' })).toBe(false);
    expect(isPublished({ status: 'SCHEDULED' })).toBe(false);
    expect(isPublished({ status: '' })).toBe(false);
  });

  it('filters a mixed set of rows down to the published ones', () => {
    const rows = [
      { id: '1', status: 'PUBLISHED' },
      { id: '2', status: 'DRAFT' },
      { id: '3', status: 'PUBLISHED' },
    ];
    expect(rows.filter(isPublished).map((r) => r.id)).toEqual(['1', '3']);
  });
});
