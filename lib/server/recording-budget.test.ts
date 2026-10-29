import { describe, expect, it } from 'vitest';

import {
  BYTES_PER_LEASE,
  DAILY_BYTES,
  DAILY_OBJECTS,
  DailyBudget,
  LEASES_PER_DAY,
  OBJECTS_PER_LEASE,
  leaseKey,
  type LeaseStore,
} from './recording-budget';
import { MAX_BODY_BYTES, MAX_CHUNKS_PER_SESSION } from '@/lib/recorder/protocol';

const DAY = Date.UTC(2026, 10, 2, 12);

/** An in-memory bucket of lease objects shared by any number of "instances". */
function bucket() {
  const keys = new Set<string>();
  const ops = { head: 0, put: 0, failedPut: 0 };
  let down = false;
  const store: LeaseStore = {
    async exists(key) {
      if (down) return 'failed';
      ops.head++;
      return keys.has(key) ? 'exists' : 'missing';
    },
    async claim(key) {
      if (down) return 'failed';
      ops.put++;
      if (keys.has(key)) {
        ops.failedPut++;
        return 'exists';
      }
      keys.add(key);
      return 'created';
    },
  };
  return { store, keys, ops, setDown: (v: boolean) => (down = v) };
}

describe('the free-tier arithmetic (Cloudflare R2 pricing, read 29 Oct 2026)', () => {
  // Free tier: 10 GB-month storage, 1,000,000 Class A and 10,000,000 Class B a month.
  // Target: at most half of each.
  const CLASS_A_TARGET = 500_000;
  const STORAGE_TARGET_BYTES = 5 * 1000 ** 3; // 5 GB, decimal: the stricter reading
  const DAYS_IN_LONGEST_MONTH = 31;
  const RETENTION_DAYS = 90 + 1; // lifecycle rule, plus a day's lag before it runs

  it('caps a day at 10,000 objects and 50 MiB', () => {
    expect(DAILY_OBJECTS).toBe(10_000);
    expect(DAILY_BYTES).toBe(50 * 1024 * 1024);
  });

  it('keeps the worst-case month of writes under 500k Class A', () => {
    const objectPuts = DAILY_OBJECTS * DAYS_IN_LONGEST_MONTH; // 310,000
    const leasePuts = LEASES_PER_DAY * DAYS_IN_LONGEST_MONTH; // 6,200
    const timelineLists = 300 * DAYS_IN_LONGEST_MONTH; // replay-timelines' --max-lists, one run a day: 9,300
    const total = objectPuts + leasePuts + timelineLists;
    expect(total).toBe(325_500);
    expect(total).toBeLessThan(CLASS_A_TARGET);
    // What is left absorbs lost lease races (one failed PUT each), realistically none:
    expect(CLASS_A_TARGET - total).toBeGreaterThan(170_000);
  });

  it('keeps 90 days at the daily maximum under 5 GB', () => {
    const peak = DAILY_BYTES * RETENTION_DAYS;
    expect(peak).toBe(4_771_020_800); // 4.77 GB
    expect(peak).toBeLessThan(STORAGE_TARGET_BYTES);
  });

  it('fits the largest chunk and its meta inside one lease', () => {
    expect(MAX_BODY_BYTES + 4096).toBeLessThanOrEqual(BYTES_PER_LEASE);
    expect(OBJECTS_PER_LEASE).toBeGreaterThanOrEqual(2);
  });

  it('bounds one recording at 120 objects and 23 MiB', () => {
    expect(MAX_CHUNKS_PER_SESSION).toBe(120);
    expect(MAX_CHUNKS_PER_SESSION * MAX_BODY_BYTES).toBeLessThanOrEqual(23 * 1024 * 1024);
  });
});

describe('DailyBudget', () => {
  it('claims one lease, then spends it from memory with no R2 calls', async () => {
    const b = bucket();
    const budget = new DailyBudget(b.store, () => DAY);
    expect(await budget.reserve(2, 1000)).toBe(true);
    const after = { ...b.ops };
    for (let i = 0; i < OBJECTS_PER_LEASE - 2; i++) expect(await budget.reserve(1, 10)).toBe(true);
    expect(b.ops).toEqual(after);
    expect([...b.keys]).toEqual([leaseKey('2026-11-02', 0)]);
    expect(after.head).toBeLessThanOrEqual(8);
    expect(after.put).toBe(1);
  });

  it('claims the next lease when the objects or the bytes run out', async () => {
    const b = bucket();
    const budget = new DailyBudget(b.store, () => DAY);
    for (let i = 0; i < OBJECTS_PER_LEASE + 1; i++) await budget.reserve(1, 1);
    expect(b.keys.size).toBe(2);
    await budget.reserve(1, BYTES_PER_LEASE);
    expect(b.keys.size).toBe(3);
  });

  it('never lets all instances together go past the daily objects or bytes', async () => {
    const b = bucket();
    const instances = Array.from({ length: 7 }, () => new DailyBudget(b.store, () => DAY));
    let objects = 0;
    let bytes = 0;
    let granted = 0;
    // Far more demand than a day allows, spread over the instances, some concurrent.
    for (let round = 0; round < 3000; round++) {
      const batch = instances.map((inst, i) => {
        const size = 1000 + ((round * 7 + i * 13) % 9000);
        return inst.reserve(1, size).then(ok => {
          if (ok) {
            objects++;
            bytes += size;
            granted++;
          }
        });
      });
      await Promise.all(batch);
    }
    expect(granted).toBeGreaterThan(0);
    expect(objects).toBeLessThanOrEqual(DAILY_OBJECTS);
    expect(bytes).toBeLessThanOrEqual(DAILY_BYTES);
    expect(b.keys.size).toBeLessThanOrEqual(LEASES_PER_DAY);
  });

  it('once the day is spent, refuses everything and stops calling R2', async () => {
    const b = bucket();
    for (let i = 0; i < LEASES_PER_DAY; i++) b.keys.add(leaseKey('2026-11-02', i));
    const budget = new DailyBudget(b.store, () => DAY);
    expect(await budget.reserve(1, 1)).toBe(false);
    const after = { ...b.ops };
    for (let i = 0; i < 100; i++) expect(await budget.reserve(1, 1)).toBe(false);
    expect(b.ops).toEqual(after);
    expect(after.put).toBe(0); // the search found no gap, so not even a failed PUT
  });

  it('starts again the next day', async () => {
    const b = bucket();
    let now = DAY;
    for (let i = 0; i < LEASES_PER_DAY; i++) b.keys.add(leaseKey('2026-11-02', i));
    const budget = new DailyBudget(b.store, () => now);
    expect(await budget.reserve(1, 1)).toBe(false);
    now += 24 * 3600 * 1000;
    expect(await budget.reserve(1, 1)).toBe(true);
    expect(b.keys.has(leaseKey('2026-11-03', 0))).toBe(true);
  });

  it('a held lease is not carried into the next day', async () => {
    const b = bucket();
    let now = DAY;
    const budget = new DailyBudget(b.store, () => now);
    await budget.reserve(1, 1);
    now += 24 * 3600 * 1000;
    await budget.reserve(1, 1);
    expect(budget.state.held?.day).toBe('2026-11-03');
  });

  it('fails closed when R2 cannot be reached', async () => {
    const b = bucket();
    b.setDown(true);
    const budget = new DailyBudget(b.store, () => DAY);
    expect(await budget.reserve(1, 1)).toBe(false);
  });

  it('refuses a reservation bigger than a lease', async () => {
    const budget = new DailyBudget(bucket().store, () => DAY);
    expect(await budget.reserve(1, BYTES_PER_LEASE + 1)).toBe(false);
    expect(await budget.reserve(OBJECTS_PER_LEASE + 1, 1)).toBe(false);
    expect(await budget.reserve(0, 1)).toBe(false);
  });

  it('serialises concurrent reservations on one instance, so a lease is never double-spent', async () => {
    const b = bucket();
    const budget = new DailyBudget(b.store, () => DAY);
    const results = await Promise.all(Array.from({ length: OBJECTS_PER_LEASE * 2 }, () => budget.reserve(1, 1)));
    expect(results.every(Boolean)).toBe(true);
    expect(b.keys.size).toBe(2);
  });

  it('a lost race costs one failed PUT and moves to the next lease', async () => {
    const b = bucket();
    const a = new DailyBudget(b.store, () => DAY);
    const c = new DailyBudget(b.store, () => DAY);
    await Promise.all([a.reserve(1, 1), c.reserve(1, 1)]);
    expect(b.keys.size).toBe(2);
    expect(b.ops.failedPut).toBeLessThanOrEqual(1);
  });
});
