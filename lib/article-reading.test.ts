import { describe, expect, it } from 'vitest';
import { articlePublishedAt, formatArticleDate, readingMinutes, wordCount } from './article-reading';

const para = (text: string) => ({ id: text.slice(0, 8), type: 'paragraph', paragraph: { rich_text: [{ plain_text: text }] } });

describe('article reading helpers', () => {
  it('counts the words of running text and skips images', () => {
    const blocks = [para('one two three'), { id: 'img', type: 'image', image: { caption: [{ plain_text: 'not counted' }] } }];
    expect(wordCount(blocks)).toBe(3);
  });

  it('rounds to whole minutes at 200 words a minute, never below one', () => {
    expect(readingMinutes([])).toBe(1);
    expect(readingMinutes([para(Array(900).fill('w').join(' '))])).toBe(5);
  });

  it('dates a piece by its publish time, falling back to the draft date like the feed', () => {
    expect(articlePublishedAt({ published_time: '2026-08-18T09:00:00.000Z', created_time: '2026-08-10T00:00:00.000Z' })).toBe('2026-08-18T09:00:00.000Z');
    expect(articlePublishedAt({ created_time: '2026-08-10T00:00:00.000Z' })).toBe('2026-08-10T00:00:00.000Z');
  });

  it('formats the date in the page language, in Oslo time', () => {
    expect(formatArticleDate('2026-08-07T23:30:00.000Z')).toBe('8 August 2026');
    expect(formatArticleDate('2026-08-07T23:30:00.000Z', 'no')).toBe('8. august 2026');
    expect(formatArticleDate(undefined)).toBe('');
  });
});
