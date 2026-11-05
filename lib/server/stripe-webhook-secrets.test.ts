import { describe, it, expect } from 'vitest';
import { verifyWithAny, webhookSecrets } from './stripe-webhook-secrets';

describe('webhookSecrets', () => {
  it('is empty when nothing is set, so the webhook stays off', () => {
    expect(webhookSecrets({})).toEqual([]);
  });
  it('is the one secret normally', () => {
    expect(webhookSecrets({ STRIPE_WEBHOOK_SECRET: 'whsec_new' })).toEqual(['whsec_new']);
  });
  it('adds the previous account\'s secret after the current one during a switch', () => {
    expect(webhookSecrets({ STRIPE_WEBHOOK_SECRET: 'whsec_new', STRIPE_WEBHOOK_SECRET_PREVIOUS: ' whsec_old , ' }))
      .toEqual(['whsec_new', 'whsec_old']);
  });
  it('never lists a secret twice', () => {
    expect(webhookSecrets({ STRIPE_WEBHOOK_SECRET: 'a', STRIPE_WEBHOOK_SECRET_PREVIOUS: 'a,b' })).toEqual(['a', 'b']);
  });
});

describe('verifyWithAny', () => {
  const verifier = (good: string) => async (secret: string) => {
    if (secret !== good) throw new Error(`bad signature for ${secret}`);
    return { ok: secret };
  };
  it('accepts an event signed by the current account', async () => {
    expect(await verifyWithAny(['new', 'old'], verifier('new'))).toEqual({ ok: 'new' });
  });
  it('accepts an event signed by the previous account during the overlap', async () => {
    expect(await verifyWithAny(['new', 'old'], verifier('old'))).toEqual({ ok: 'old' });
  });
  it('rejects an event neither signed, with the current secret\'s error', async () => {
    await expect(verifyWithAny(['new', 'old'], verifier('forged'))).rejects.toThrow('bad signature for new');
  });
  it('rejects when there is no secret at all', async () => {
    await expect(verifyWithAny([], verifier('x'))).rejects.toThrow('No webhook secret');
  });
});
