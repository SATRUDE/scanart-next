import { describe, it, expect } from 'vitest';
import { MAX_FREE_TEXT, buildSlackFeedbackMessage, validateFeedback } from './slack-feedback';

describe('validateFeedback', () => {
  it('accepts a real answer to each question', () => {
    expect(validateFeedback({ step: 'q1', answer: 'Nearly' })).toMatchObject({ step: 'q1', answer: 'Nearly' });
    expect(validateFeedback({ step: 'q2', answer: 'Delivery cost' })).toMatchObject({ answer: 'Delivery cost' });
    expect(validateFeedback({ step: 'q3', answer: 'the frames looked pricey' })).toMatchObject({ step: 'q3' });
  });

  it('rejects anything that is not one of the offered options on the closed questions', () => {
    // The route is public, so a field that looks constrained must actually be
    // constrained: otherwise it is an open pipe into a Slack channel.
    expect(validateFeedback({ step: 'q1', answer: 'buy cheap watches' })).toEqual({ error: 'q1-not-an-option' });
    expect(validateFeedback({ step: 'q2', answer: '<script>' })).toEqual({ error: 'q2-not-an-option' });
  });

  it('rejects a bad step, a non-object and an empty answer', () => {
    expect(validateFeedback({ step: 'q4', answer: 'x' })).toEqual({ error: 'bad-step' });
    expect(validateFeedback('nope')).toEqual({ error: 'not-an-object' });
    expect(validateFeedback({ step: 'q3', answer: '   ' })).toEqual({ error: 'empty-answer' });
  });

  it('truncates long free text rather than rejecting it', () => {
    const r = validateFeedback({ step: 'q3', answer: 'x'.repeat(MAX_FREE_TEXT + 500) });
    expect('error' in r).toBe(false);
    if (!('error' in r)) expect(r.answer).toHaveLength(MAX_FREE_TEXT);
  });

  it('drops an unrecognised placement instead of passing it through', () => {
    const r = validateFeedback({ step: 'q1', answer: 'Yes', placement: 'somewhere-else' });
    if (!('error' in r)) expect(r.placement).toBeUndefined();
  });
});

describe('buildSlackFeedbackMessage', () => {
  it('names the question so an answer is readable on its own', () => {
    const m = buildSlackFeedbackMessage({ step: 'q2', answer: 'Price', placement: 'checkout', path: '/checkout' });
    expect(JSON.stringify(m)).toContain('What stopped you buying today?');
    expect(JSON.stringify(m)).toContain('Price');
    expect(JSON.stringify(m)).toContain('/checkout');
  });
});
