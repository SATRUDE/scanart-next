import { neon } from '@neondatabase/serverless';

// Discount codes live in the socialagent store (the DiscountCode table), the
// same move articles and products made. They used to live in the
// DISCOUNT_CODES env var, which could never say how often a code had actually
// been paid with, and which in practice was never set in production, so every
// code a buyer typed was rejected.
//
// Failing closed is the rule throughout: no database, no rows, an expired or
// switched-off code, all mean no discount. A checkout that charges full price
// when the store is unreachable is a bad afternoon; one that gives money away
// is a bad quarter.

export interface Discount {
  code: string;
  percentage: number;
}

export interface DiscountRow {
  code: string;
  percentage: number;
  active: boolean;
  expiresAt: string | Date | null;
}

/** Injected so the maths can be tested without a database. */
export type DiscountLookup = (code: string) => Promise<Discount | null>;

/** Buyers type codes in any case and with stray spaces; the store is upper-case. */
export function normaliseCode(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  if (!code || code.length > 40) return null;
  return code;
}

/**
 * Decide whether a row from the store is usable right now. Pure, so the two
 * ways a code can be dead (switched off, expired) are covered by tests rather
 * than by hoping the SQL was right.
 */
export function selectValidDiscount(row: DiscountRow | undefined | null, now: Date): Discount | null {
  if (!row) return null;
  if (!row.active) return null;
  if (row.expiresAt && new Date(row.expiresAt).getTime() <= now.getTime()) return null;
  const percentage = Number(row.percentage);
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) return null;
  return { code: row.code, percentage };
}

function databaseUrl(): string | undefined {
  return process.env.ARTICLES_DATABASE_URL ?? process.env.DATABASE_URL;
}

/** Look a code up in the store. Any failure means no discount, never a throw. */
export const lookupDiscountCode: DiscountLookup = async code => {
  const normalised = normaliseCode(code);
  if (!normalised) return null;
  const url = databaseUrl();
  if (!url) return null;

  try {
    const sql = neon(url);
    const rows = (await sql`
      SELECT "code", "percentage", "active", "expiresAt"
      FROM "DiscountCode"
      WHERE "code" = ${normalised}
      LIMIT 1
    `) as unknown as DiscountRow[];
    return selectValidDiscount(rows[0], new Date());
  } catch (error) {
    console.error('[discounts] lookup failed, treating as no discount:', error);
    return null;
  }
};

/**
 * Count a code as redeemed. Called from the Stripe webhook on a completed
 * payment, so the number means paid orders and never attempts. A failure here
 * must not fail the webhook: the order matters, the counter does not.
 */
export async function recordRedemption(code: string): Promise<void> {
  const normalised = normaliseCode(code);
  const url = databaseUrl();
  if (!normalised || !url) return;
  try {
    const sql = neon(url);
    await sql`
      UPDATE "DiscountCode"
      SET "redemptions" = "redemptions" + 1, "updatedAt" = NOW()
      WHERE "code" = ${normalised}
    `;
  } catch (error) {
    console.error('[discounts] could not record the redemption:', error);
  }
}
