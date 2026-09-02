'use client';

import { useId, useState } from 'react';
import { TrackedLink } from '@/components/TrackedLink';
import {
  calculateGalleryWall,
  formatCentimetres,
  PRINT_SIZES,
  type PrintSizeKey,
} from '@/lib/gallery-wall-calculator';

const DEFAULTS = { wallWidth: 240, printSize: '50x70' as PrintSizeKey, frameCount: 3, gap: 6 };

/**
 * `locale` follows LandingCrossLinks: the component carries its own prefix so
 * a literal English path cannot leak on a Norwegian render. There is no
 * Norwegian article route today, so this changes nothing yet - but
 * lib/i18n-no.test.ts sweeps EVERY component rather than a hand-picked list,
 * deliberately, because where a component is mounted is not visible from the
 * guard and "article-only" is one page away from being untrue.
 */
export function GalleryWallCalculator({ locale = 'en' }: { locale?: 'en' | 'no' } = {}) {
  const localePrefix = locale === 'no' ? '/no' : '';
  const id = useId();
  const [wallWidthInput, setWallWidthInput] = useState(String(DEFAULTS.wallWidth));
  const [printSize, setPrintSize] = useState<PrintSizeKey>(DEFAULTS.printSize);
  const [frameCountInput, setFrameCountInput] = useState(String(DEFAULTS.frameCount));
  const [gapInput, setGapInput] = useState(String(DEFAULTS.gap));

  const wallWidth = Number(wallWidthInput);
  const frameCount = Number(frameCountInput);
  const gap = Number(gapInput);
  const wallError = wallWidthInput === '' ? 'Enter your wall width.' : wallWidth <= 0 ? 'Use a wall width greater than 0 cm.' : '';
  const countError = frameCountInput === '' ? 'Choose how many frames you’re hanging.' : !Number.isInteger(frameCount) ? 'Use a whole number of frames.' : frameCount < 1 || frameCount > 12 ? 'Choose between 1 and 12 frames.' : '';
  const gapError = gapInput === '' ? 'Enter the gap you’d like between the frames.' : gap < 0 ? 'The gap can’t be less than 0 cm.' : '';
  const isValid = !wallError && !countError && !gapError && Number.isFinite(wallWidth) && Number.isFinite(frameCount) && Number.isFinite(gap);
  const safeWallWidth = isValid ? wallWidth : DEFAULTS.wallWidth;
  const safeFrameCount = isValid ? frameCount : DEFAULTS.frameCount;
  const safeGap = isValid ? gap : DEFAULTS.gap;

  const result = calculateGalleryWall({
    wallWidth: safeWallWidth,
    printSize,
    frameCount: safeFrameCount,
    gap: safeGap,
  });
  const print = PRINT_SIZES[printSize];
  const previewScale = Math.min(1, safeWallWidth / Math.max(result.totalWidth, safeWallWidth));
  const arrangementPercent = Math.max(8, (result.totalWidth / Math.max(result.totalWidth, safeWallWidth)) * 100);

  const statusCopy = {
    fit: 'That fits comfortably. The frames should read as one group, with enough room around them.',
    tight: 'It fits, but only just. Check nearby furniture, switches and corners before you hang.',
    exact: 'It fits exactly, with no space left at either side. Give it a little breathing room before reaching for the drill.',
    'no-fit': `This arrangement is ${formatCentimetres(result.overflow)} wider than the wall. Remove a print or reduce the gap.`,
  }[result.fitStatus];

  const liveCopy = result.fitStatus === 'no-fit'
    ? `This row is ${formatCentimetres(result.overflow)} wider than your wall. Try fewer frames, a smaller print or a narrower gap.`
    : result.fitStatus === 'exact' || result.fitStatus === 'tight'
      ? statusCopy
      : result.gapStatus === 'tight'
        ? 'The row fits, but the frames may feel cramped. Try a gap of 5 to 8 cm if the wall allows.'
        : result.gapStatus === 'wide'
          ? 'The row fits, but the frames may start to feel separate. Bring the gap back to 5 to 8 cm.'
          : statusCopy;

  return (
    <section className="not-prose my-10 scroll-mt-20 border-y border-neutral-300 py-7" aria-labelledby={`${id}-title`}>
      <div className="mb-6 max-w-2xl">
        <h3 id={`${id}-title`} className="text-2xl font-medium text-neutral-900">Gallery wall spacing calculator</h3>
        <p className="mt-2 leading-relaxed text-neutral-700">See how a straight row of equal-sized frames will sit on your wall.</p>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-wall`}>
          Wall width <span className="font-normal text-neutral-600">(cm)</span>
          <input id={`${id}-wall`} type="number" inputMode="decimal" min="1" max="1200" step="1" value={wallWidthInput} aria-invalid={Boolean(wallError)} aria-describedby={`${id}-wall-help${wallError ? ` ${id}-wall-error` : ''}`} onChange={event => setWallWidthInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-wall-help`} className="mt-1 block text-xs font-normal text-neutral-600">Measure the usable wall space, not the whole room.</span>
          {wallError && <span id={`${id}-wall-error`} className="mt-1 block text-xs font-normal text-destructive">{wallError}</span>}
        </label>

        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-size`}>
          Print size
          <select id={`${id}-size`} value={printSize} onChange={event => setPrintSize(event.currentTarget.value as PrintSizeKey)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900">
            {Object.entries(PRINT_SIZES).map(([value, size]) => <option key={value} value={value}>{size.label}</option>)}
          </select>
        </label>

        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-count`}>
          Number of frames
          <input id={`${id}-count`} type="number" inputMode="numeric" min="1" max="12" step="1" value={frameCountInput} aria-invalid={Boolean(countError)} aria-describedby={countError ? `${id}-count-error` : undefined} onChange={event => setFrameCountInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          {countError && <span id={`${id}-count-error`} className="mt-1 block text-xs font-normal text-destructive">{countError}</span>}
        </label>

        <label className="text-sm font-medium text-neutral-800" htmlFor={`${id}-gap`}>
          Gap between frames <span className="font-normal text-neutral-600">(cm)</span>
          <input id={`${id}-gap`} type="number" inputMode="decimal" min="0" max="30" step="0.5" value={gapInput} aria-invalid={Boolean(gapError)} aria-describedby={`${id}-gap-help${gapError ? ` ${id}-gap-error` : ''}`} onChange={event => setGapInput(event.currentTarget.value)} className="mt-1.5 min-h-11 w-full rounded-md border border-neutral-300 px-3 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive" />
          <span id={`${id}-gap-help`} className="mt-1 block text-xs font-normal text-neutral-600">A gap of 5 to 8 cm usually keeps the frames reading as one group.</span>
          {gapError && <span id={`${id}-gap-error`} className="mt-1 block text-xs font-normal text-destructive">{gapError}</span>}
        </label>
      </div>

      <div className="mt-7">
        <p className="mb-2 text-xs uppercase tracking-wide text-neutral-600">Wall preview</p>
        <div className="h-40 overflow-hidden border border-neutral-300 px-3 pb-4 pt-6 sm:h-[180px] sm:px-6" aria-hidden="true">
        <div className="mx-auto flex h-full max-w-full items-center justify-center overflow-hidden border-x border-b border-neutral-300" style={{ width: `${previewScale * 100}%` }}>
          <div className="flex max-w-full items-center justify-center" style={{ width: `${arrangementPercent}%`, gap: `${Math.max(2, safeGap * 0.55)}px` }}>
            {Array.from({ length: safeFrameCount }, (_, index) => (
              <div key={index} className="shrink border-2 border-neutral-800 bg-neutral-100 p-1" style={{ aspectRatio: `${print.width} / ${print.height}`, width: `${100 / safeFrameCount}%`, maxWidth: print.height === 70 ? '54px' : '62px' }}>
                <div className="h-full w-full border border-neutral-300" />
              </div>
            ))}
          </div>
        </div></div>
      </div>

      <h4 className="mt-6 text-lg font-medium text-neutral-900">Your arrangement</h4>
      <div className="mt-2 grid grid-cols-1 border-y border-neutral-300 sm:grid-cols-3 sm:divide-x sm:divide-neutral-300">
        <div className="py-4 sm:pr-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Whole row</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(result.totalWidth) : '—'}</strong></div>
        <div className="border-t border-neutral-300 py-4 sm:border-t-0 sm:px-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Space at each side</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{!isValid ? '—' : result.fitStatus === 'no-fit' ? 'Does not fit' : formatCentimetres(result.sideMargin)}</strong></div>
        <div className="border-t border-neutral-300 py-4 sm:border-t-0 sm:pl-4"><span className="block text-xs uppercase tracking-wide text-neutral-600">Gap between frames</span><strong className="mt-1 block text-xl font-medium text-neutral-900">{isValid ? formatCentimetres(gap) : '—'}</strong></div>
      </div>

      <div className="mt-5 text-sm leading-relaxed text-neutral-800" role="status" aria-live="polite" aria-atomic="true">
        <p className="font-medium">{isValid ? liveCopy : 'Complete the fields above to see your arrangement.'}</p>
      </div>

      <p className="mt-5 text-sm text-neutral-700">This is a planning guide based on print dimensions. Frames add a little width, so measure their outside edges before fixing any hooks.</p>
      <p className="mt-5 text-sm text-neutral-700">Now find the pieces that will make the row worth hanging.</p>
      <TrackedLink event="gallery-wall-calculator-products-click" eventData={{ article: 'create-an-art-wall' }} href={`${localePrefix}/products`} className="mt-2 inline-flex min-h-11 items-center border-b border-neutral-900 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Browse the print collection <span aria-hidden="true" className="ml-1">→</span></TrackedLink>
    </section>
  );
}
