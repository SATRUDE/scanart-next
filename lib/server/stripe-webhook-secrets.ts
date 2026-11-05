// Which webhook signing secrets the Stripe webhook accepts.
//
// Normally one: STRIPE_WEBHOOK_SECRET, the endpoint's secret in the Stripe
// account the shop takes payments with. During a switch of Stripe account
// (T-0237, Mark, 2026-10-21: from Allianse Limited's account to his own) a
// buyer who opened checkout on the old build pays the OLD account, and that
// account's endpoint signs with its own secret. STRIPE_WEBHOOK_SECRET_PREVIOUS
// holds that old secret for the overlap, so the order is still recorded
// rather than rejected as a bad signature. Remove it once the old account has
// gone quiet (a day or two after the switch); nothing else changes.
//
// Verifying a signature needs only the secret, not an API key for the account
// that sent it, so one Stripe client can check both.

/** The secrets to try, current first. Empty when the webhook is not set up. */
export function webhookSecrets(env: Record<string, string | undefined> = process.env): string[] {
  const current = env.STRIPE_WEBHOOK_SECRET?.trim();
  const previous = (env.STRIPE_WEBHOOK_SECRET_PREVIOUS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return [...new Set([current, ...previous].filter((s): s is string => !!s))];
}

/**
 * Verify `body` against each secret in turn and return the first event that
 * checks out. Throws the CURRENT secret's error when none do, so the log reads
 * the same as it did with one secret.
 */
export async function verifyWithAny<E>(
  secrets: string[],
  verify: (secret: string) => Promise<E>,
): Promise<E> {
  if (secrets.length === 0) throw new Error('No webhook secret configured');
  let first: unknown;
  for (const secret of secrets) {
    try {
      return await verify(secret);
    } catch (error) {
      first ??= error;
    }
  }
  throw first;
}
