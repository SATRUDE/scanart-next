// The hard cap that keeps session recordings inside Cloudflare R2's free tier
// (Mark, 29 October 2026: usage must never go past it). R2 has no spending cap
// of its own, so it is enforced here, before anything reaches R2, and it fails
// closed: when the budget is spent, or the budget cannot be checked, the chunk
// is dropped and the recorder stops for that tab.
//
// Free tier (https://developers.cloudflare.com/r2/pricing/, read 29 Oct 2026):
// 10 GB-month storage, 1 million Class A operations (PutObject, ListObjects...)
// and 10 million Class B (GetObject, HeadObject) a month. Failed conditional
// PUTs (412) are billed as Class A; DeleteObject is free. We aim at 50% of each.
//
// The daily budget, 10,000 objects and 50 MiB, is cut into 200 leases of 50
// objects and 256 KiB each. Leases are objects in the bucket,
// budget/YYYY-MM-DD/NNN, claimed with a conditional PUT (If-None-Match: *), so
// only one serverless instance can ever hold a given lease. An instance spends
// its lease from memory, with no further R2 calls, and claims the next one when
// it runs out. Every chunk PUT (and every meta.json PUT) is paid for from a held
// lease BEFORE it is sent, so even a failed or refused write uses budget. So,
// across all instances together, no day can ever see more than:
//
//   200 leases x 50 objects   = 10,000 object PUTs
//   200 leases x 256 KiB      = 50 MiB stored
//   200 lease PUTs, plus one failed lease PUT per lost race (two instances
//   claiming the same lease in the same instant; realistically none)
//
// Finding the next free lease is a binary search with HEAD requests (Class B):
// leases are always claimed lowest-first, so the claimed ones are a prefix.
// That is at most 8 HEADs per claim. An instance that finds all 200 claimed
// remembers that for the rest of the day and makes no more R2 calls.
//
// Abandoned remainder (an instance that dies holding half a lease) is simply
// lost for the day: the cap errs towards recording less, never more.
//
// The arithmetic against the free tier is in the PR body (T-0411) and in
// lib/server/recording-budget.test.ts, which checks the constants.

export const LEASES_PER_DAY = 200;
export const OBJECTS_PER_LEASE = 50;
export const BYTES_PER_LEASE = 256 * 1024;
export const DAILY_OBJECTS = LEASES_PER_DAY * OBJECTS_PER_LEASE; // 10,000
export const DAILY_BYTES = LEASES_PER_DAY * BYTES_PER_LEASE; // 50 MiB
/** A claim that loses a race tries the next lease, at most this many times. */
const MAX_PUT_TRIES_PER_CLAIM = 3;

export type LeaseStore = {
  /** HEAD: does this lease object exist? */
  exists(key: string): Promise<'exists' | 'missing' | 'failed'>;
  /** Conditional PUT of an empty lease object. */
  claim(key: string): Promise<'created' | 'exists' | 'failed'>;
};

export function leaseKey(day: string, index: number): string {
  return `budget/${day}/${String(index).padStart(3, '0')}`;
}

const dayOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type Held = { day: string; index: number; objects: number; bytes: number };

export class DailyBudget {
  private held: Held | null = null;
  private exhaustedDay: string | null = null;
  private lock: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: LeaseStore,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * Pays for `objects` PUTs totalling `bytes` from today's budget. Resolves
   * true only if the whole amount was reserved; false means drop the chunk.
   * Calls are serialised, so concurrent requests on one instance never
   * double-spend a lease.
   */
  reserve(objects: number, bytes: number): Promise<boolean> {
    const run = this.lock.then(() => this.reserveNow(objects, bytes));
    this.lock = run.catch(() => false);
    return run.catch(() => false);
  }

  private async reserveNow(objects: number, bytes: number): Promise<boolean> {
    if (objects < 1 || objects > OBJECTS_PER_LEASE || bytes < 0 || bytes > BYTES_PER_LEASE) return false;
    const day = dayOf(this.now());
    if (this.exhaustedDay === day) return false;
    if (!this.held || this.held.day !== day || this.held.objects < objects || this.held.bytes < bytes) {
      this.held = null;
      const index = await this.claimNext(day);
      if (index === null) return false;
      this.held = { day, index, objects: OBJECTS_PER_LEASE, bytes: BYTES_PER_LEASE };
    }
    this.held.objects -= objects;
    this.held.bytes -= bytes;
    return true;
  }

  /** The lowest free lease today, claimed; null if none is left or R2 cannot
   * be reached (fail closed). */
  private async claimNext(day: string): Promise<number | null> {
    let lo = 0;
    let hi = LEASES_PER_DAY;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const state = await this.store.exists(leaseKey(day, mid));
      if (state === 'failed') return null;
      if (state === 'exists') lo = mid + 1;
      else hi = mid;
    }
    let i = lo;
    for (let tries = 0; i < LEASES_PER_DAY && tries < MAX_PUT_TRIES_PER_CLAIM; i++, tries++) {
      const result = await this.store.claim(leaseKey(day, i));
      if (result === 'created') return i;
      if (result === 'failed') return null;
      // 'exists': another instance won this one in the same instant; try the next.
    }
    if (i >= LEASES_PER_DAY) this.exhaustedDay = day;
    return null;
  }

  /** For tests and logs. */
  get state(): { held: Held | null; exhaustedDay: string | null } {
    return { held: this.held ? { ...this.held } : null, exhaustedDay: this.exhaustedDay };
  }
}
