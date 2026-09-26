// Screenshot a page at desktop (1440) and mobile (390) for comparison with Figma.
//   node scripts/v2/shoot.mjs /about out/about   → out/about-desktop.png, out/about-mobile.png
// Uses the dev server on V2_URL (default http://localhost:3100).
import { chromium } from 'playwright';
const [path = '/', out = 'shot', only] = process.argv.slice(2);
const base = process.env.V2_URL || 'http://localhost:3100';
const browser = await chromium.launch();
for (const [name, width] of [['desktop', 1440], ['mobile', 390]]) {
  if (only && only !== name) continue;
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1, locale: 'en-GB' });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}-${name}.png`, fullPage: true });
  await page.close();
}
await browser.close();
console.log('ok', out);
