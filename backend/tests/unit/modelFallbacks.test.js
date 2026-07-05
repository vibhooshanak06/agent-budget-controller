'use strict';

const { getFallbackChain } = require('../../src/config/modelFallbacks');

describe('modelFallbacks', () => {
  test('returns fallback chain for gpt-4o', () => {
    const chain = getFallbackChain('gpt-4o');
    expect(chain.length).toBeGreaterThan(0);
    chain.forEach((tier) => {
      expect(tier).toHaveProperty('threshold');
      expect(tier).toHaveProperty('model');
      expect(typeof tier.threshold).toBe('number');
      expect(tier.threshold).toBeGreaterThan(0);
      expect(tier.threshold).toBeLessThanOrEqual(1);
    });
  });

  test('returns empty array for models with no fallback', () => {
    expect(getFallbackChain('gpt-3.5-turbo')).toEqual([]);
  });

  test('returns empty array for unknown model', () => {
    expect(getFallbackChain('some-unknown-model-xyz')).toEqual([]);
  });

  test('chain thresholds are in ascending order', () => {
    const chain = getFallbackChain('gpt-4-turbo');
    const thresholds = chain.map((t) => t.threshold);
    const sorted = [...thresholds].sort((a, b) => a - b);
    expect(thresholds).toEqual(sorted);
  });

  test('fallback models are strings', () => {
    const chain = getFallbackChain('gpt-4o');
    chain.forEach((tier) => expect(typeof tier.model).toBe('string'));
  });
});
