import { quoteDelivery } from '@/lib/server/shipping-rates';
import { getAllProducts } from '@/lib/products';
import {
  GUIDE_CURRENCIES,
  GUIDE_DESTINATIONS,
  type DeliveryGuide,
  type GuideDestination,
} from '@/lib/delivery-guide';
import type { Currency } from '@/lib/pricing';

// The delivery guide, priced by the checkout's own function.
//
// Until 2026-09-26 the basket panel, the product page and the Help answer on
// delivery cost all quoted config/shipping.ts, a table written by hand before
// the shop charged from the socialagent store (2026-08-12). The store is
// right and the table was not: GB, Norway, the US and the rest of the world
// all differed. Mark: "The delivery prices are all in the social agent so
// match them to there."
//
// So this asks quoteDelivery, the function checkout charges with, what ONE
// unframed print costs to each destination in each currency, for every size
// the catalogue sells, and keeps the cheapest: an honest "from". A frame costs
// more to post and a second print adds to it, which the copy says in words.
//
// It runs where the pages render, at build on Vercel (the database URL is
// there), so every page stays static and the guide is as fresh as the last
// deploy. With no database it gets exactly what checkout would get, the
// config/shipping.ts fallback, and the pages still render.

/**
 * Rest of world, priced from a spread of the places most orders outside the
 * five markets go: Europe, North America, Australia and Japan. The lowest of
 * them is the "from".
 */
export const REST_OF_WORLD_SAMPLE = ['DE', 'FR', 'NL', 'IE', 'ES', 'IT', 'CA', 'AU', 'JP'];

/** How long one snapshot is reused within a running server (dev, mostly). */
const TTL_MS = 10 * 60 * 1000;
/** Parallel quotes at a time: each is three small queries. */
const CONCURRENCY = 8;

let cached: { at: number; guide: Promise<DeliveryGuide> } | undefined;

async function pool<T>(tasks: (() => Promise<T>)[], size: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        results[i] = await tasks[i]();
      }
    })
  );
  return results;
}

/** Every size at least one print is on sale in. */
async function sellableSizes(): Promise<string[]> {
  const sizes = new Set<string>();
  for (const product of await getAllProducts()) {
    for (const [size, available] of Object.entries(product.sizes ?? {})) {
      if (available) sizes.add(size);
    }
  }
  return [...sizes];
}

async function computeGuide(): Promise<DeliveryGuide> {
  const sizes = await sellableSizes();
  // No sizes means no item to quote; quoteDelivery answers an empty basket
  // with the fallback table, which is what the guide should show then too.
  const items = sizes.length ? sizes.map(size => [{ size, frame: 'no-frame', quantity: 1 }]) : [[]];

  const countries: [GuideDestination, string][] = [
    ...GUIDE_DESTINATIONS.filter(d => d !== 'ELSEWHERE').map(d => [d, d] as [GuideDestination, string]),
    ...REST_OF_WORLD_SAMPLE.map(c => ['ELSEWHERE', c] as [GuideDestination, string]),
  ];

  const jobs = countries.flatMap(([destination, country]) =>
    GUIDE_CURRENCIES.flatMap(currency =>
      items.map(basket => ({ destination, currency, run: () => quoteDelivery(country, currency, basket) }))
    )
  );
  const quotes = await pool(jobs.map(j => j.run), CONCURRENCY);

  const guide = Object.fromEntries(
    GUIDE_DESTINATIONS.map(d => [d, Object.fromEntries(GUIDE_CURRENCIES.map(c => [c, Infinity]))])
  ) as DeliveryGuide;
  jobs.forEach((job, i) => {
    const amount = quotes[i].amount;
    // A zero is a missing row, not free delivery; never advertise it.
    if (amount > 0 && amount < guide[job.destination][job.currency]) {
      guide[job.destination][job.currency] = amount;
    }
  });

  for (const d of GUIDE_DESTINATIONS) {
    for (const c of GUIDE_CURRENCIES) {
      if (!Number.isFinite(guide[d][c])) {
        const fallback = await quoteDelivery(d === 'ELSEWHERE' ? REST_OF_WORLD_SAMPLE[0] : d, c as Currency, []);
        guide[d][c] = fallback.amount;
      }
    }
  }
  return guide;
}

/**
 * The guide for this render. Built once per server process and reused for ten
 * minutes, so a build computes it once per worker rather than once per page.
 */
export function getDeliveryGuide(): Promise<DeliveryGuide> {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    const guide = computeGuide();
    cached = { at: now, guide };
    // A failure is not cached: the next render tries again.
    guide.catch(() => {
      if (cached?.guide === guide) cached = undefined;
    });
  }
  return cached.guide;
}
