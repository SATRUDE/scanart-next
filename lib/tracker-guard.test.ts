import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';

import {
  TRACKER_GUARD_FUNCTION,
  TRACKER_GUARD_SCRIPT,
  UMAMI_RECORDER_LOADER,
  UMAMI_RECORDER_SRC,
  UMAMI_WEBSITE_ID,
} from './tracker-guard';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

type Nav = { webdriver?: boolean; userAgent?: string; maxTouchPoints?: number };

// Runs the exact inline string in a sandbox, as the browser would, and returns
// what the tracker would send for one pageview.
function send(screen: string, nav: Nav = {}) {
  const window: Record<string, unknown> = {};
  vm.runInNewContext(TRACKER_GUARD_SCRIPT, {
    window,
    navigator: { userAgent: CHROME_WIN, maxTouchPoints: 0, webdriver: false, ...nav },
  });
  const hook = window[TRACKER_GUARD_FUNCTION] as (type: string, p: unknown) => unknown;
  const payload = { website: 'x', screen, url: '/' };
  return hook('event', payload);
}

describe('tracker guard', () => {
  it('drops the Singapore crawlers seen in October 2026', () => {
    // The fixed one, and three of the random near-square sizes.
    for (const screen of ['1280x1200', '1318x1185', '1203x1100', '1384x1295']) {
      expect(send(screen), screen).toBe(false);
    }
  });

  it('drops square desktop screens, which no real display has', () => {
    expect(send('1366x1366')).toBe(false);
    expect(send('2000x2000')).toBe(false);
  });

  it('sends real desktop screens, including 5:4', () => {
    for (const screen of ['1280x1024', '1600x1200', '1440x900', '1920x1080', '2560x1440', '3440x1440']) {
      expect(send(screen), screen).toEqual({ website: 'x', screen, url: '/' });
    }
  });

  it('sends phones and tablets in either orientation', () => {
    for (const screen of ['390x844', '844x390', '1024x1366', '1366x1024', '820x1180']) {
      expect(send(screen, { maxTouchPoints: 5 }), screen).not.toBe(false);
    }
  });

  it('sends a touch screen even when it is near square, so a Fold open in landscape counts', () => {
    expect(send('1104x950', { maxTouchPoints: 5 })).not.toBe(false);
  });

  it('drops any browser driven by automation, whatever its screen', () => {
    expect(send('1920x1080', { webdriver: true })).toBe(false);
  });

  it('drops headless user agents', () => {
    const headless = CHROME_WIN.replace('Chrome/', 'HeadlessChrome/');
    expect(send('1920x1080', { userAgent: headless })).toBe(false);
  });

  it('sends when the screen is missing or malformed', () => {
    expect(send('')).not.toBe(false);
    expect(send('unknown')).not.toBe(false);
  });

  it('sends rather than drops if reading the browser throws', () => {
    const window: Record<string, unknown> = {};
    const navigator = {};
    Object.defineProperty(navigator, 'webdriver', {
      get() {
        throw new Error('blocked');
      },
    });
    vm.runInNewContext(TRACKER_GUARD_SCRIPT, { window, navigator });
    const hook = window[TRACKER_GUARD_FUNCTION] as (type: string, p: unknown) => unknown;
    expect(hook('event', { screen: '1280x1200' })).toEqual({ screen: '1280x1200' });
  });

  it('is wired into the tracker tag by name', () => {
    const doc = fs.readFileSync(path.join(__dirname, '..', 'app', 'site-document.tsx'), 'utf8');
    const tracker = doc.slice(doc.indexOf('src="https://datamachine.vercel.app/script.js"') - 200, doc.indexOf('src="https://datamachine.vercel.app/script.js"') + 400);
    expect(tracker).toContain('data-before-send={TRACKER_GUARD_FUNCTION}');
    expect(doc).toContain('{TRACKER_GUARD_SCRIPT}');
  });
});

// Runs the exact loader string and returns the recorder tag it added, if any.
function loadRecorder(nav: Record<string, unknown> = {}, win: Record<string, unknown> = {}) {
  const added: Array<{ src?: string; defer?: boolean; attrs: Record<string, string> }> = [];
  const document = {
    createElement: () => {
      const el = { attrs: {} as Record<string, string>, setAttribute(k: string, v: string) { el.attrs[k] = v; } };
      return el;
    },
    head: { appendChild: (el: (typeof added)[number]) => added.push(el) },
  };
  vm.runInNewContext(UMAMI_RECORDER_LOADER, { window: win, navigator: nav, document });
  return added;
}

describe('Umami recorder loader', () => {
  it('adds the recorder with its website id for an ordinary browser', () => {
    const added = loadRecorder({ userAgent: CHROME_WIN });
    expect(added).toHaveLength(1);
    expect(added[0].src).toBe(UMAMI_RECORDER_SRC);
    expect(added[0].attrs['data-website-id']).toBe(UMAMI_WEBSITE_ID);
  });

  it('leaves the recorder out when the browser sends Global Privacy Control', () => {
    expect(loadRecorder({ globalPrivacyControl: true })).toHaveLength(0);
  });

  it('leaves the recorder out when the browser sends Do Not Track, in any of its spellings', () => {
    expect(loadRecorder({ doNotTrack: '1' })).toHaveLength(0);
    expect(loadRecorder({ msDoNotTrack: '1' })).toHaveLength(0);
    expect(loadRecorder({}, { doNotTrack: '1' })).toHaveLength(0);
  });

  it('records when Do Not Track is explicitly off or unset', () => {
    expect(loadRecorder({ doNotTrack: '0' })).toHaveLength(1);
    expect(loadRecorder({ doNotTrack: 'unspecified', globalPrivacyControl: false })).toHaveLength(1);
  });

  it('leaves the recorder out if reading the signals throws', () => {
    const nav = {};
    Object.defineProperty(nav, 'globalPrivacyControl', {
      get() {
        throw new Error('blocked');
      },
    });
    expect(loadRecorder(nav)).toHaveLength(0);
  });

  it('is the only way the recorder reaches the page', () => {
    const doc = fs.readFileSync(path.join(__dirname, '..', 'app', 'site-document.tsx'), 'utf8');
    expect(doc).toContain('{UMAMI_RECORDER_LOADER}');
    expect(doc).not.toContain('recorder.js"');
  });
});
