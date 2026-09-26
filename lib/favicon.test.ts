import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// The production build (Turbopack) refuses a favicon.ico whose PNG entries
// are not RGBA ("The PNG is not in RGBA format"), which failed two preview
// builds on 2026-09-26. The dev server never decodes it, so only this catches
// it before Vercel does.
describe('app/favicon.ico', () => {
  it('stores every size as an RGBA PNG', () => {
    const ico = readFileSync(join(process.cwd(), 'app', 'favicon.ico'));
    const count = ico.readUInt16LE(4);
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const entry = 6 + 16 * i;
      const size = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      const png = ico.subarray(offset, offset + size);
      expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
      // IHDR colour type, byte 25: 6 is truecolour with alpha.
      expect(png[25]).toBe(6);
    }
  });
});
