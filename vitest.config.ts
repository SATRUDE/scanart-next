import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Resolve a pre-installed Chromium when one is pinned under PLAYWRIGHT_BROWSERS_PATH.
//
// The nightly cloud sandbox ships a fixed Playwright browser bundle whose Chromium
// revision can lag the one the installed `playwright` package resolves (e.g. the
// sandbox provides chromium-1194 while the package looks for 1217), so
// `playwright.chromium.launch()` aborts hunting for a revision that was never
// downloaded and the whole browser-mode suite fails to run. When such a browser is
// present we launch it directly via executablePath. In normal environments (local
// dev, CI) PLAYWRIGHT_BROWSERS_PATH is unset and Playwright manages its own browsers,
// so this returns undefined and behaviour is unchanged.
function preinstalledChromiumPath(): string | undefined {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!root) return undefined;
  try {
    const dirs = fs
      .readdirSync(root)
      .filter(d => /^chromium-\d+$/.test(d))
      // Prefer the newest revision if several are present.
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
    for (const d of dirs) {
      const bin = path.join(root, d, 'chrome-linux', 'chrome');
      if (fs.existsSync(bin)) return bin;
    }
  } catch {
    // Unreadable browsers dir: fall back to Playwright's own resolution.
  }
  return undefined;
}

const chromiumExecutablePath = preinstalledChromiumPath();

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            // executablePath is undefined in normal environments, which leaves
            // Playwright to resolve its own managed browser exactly as before.
            provider: playwright({ launchOptions: { executablePath: chromiumExecutablePath } }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
