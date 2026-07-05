'use strict';

/**
 * Unit tests for metering.service.js
 * All pure functions — no DB or external calls.
 */

const {
  calculateCost,
  calculateUtilization,
  calculateRemaining,
  wouldExceedBudget,
  isWarningThreshold,
  isHardLimit,
  WARNING_THRESHOLD,
  HARD_LIMIT_THRESHOLD,
} = require('../../src/services/metering.service');

describe('metering.service', () => {
  describe('calculateCost', () => {
    test('calculates gpt-4o cost correctly', () => {
      // 1000 prompt tokens @ $0.005/1k + 500 completion @ $0.015/1k
      // = 0.005 + 0.0075 = 0.0125
      expect(calculateCost('gpt-4o', 1000, 500)).toBe(0.0125);
    });

    test('calculates gpt-4o-mini cost correctly', () => {
      // 1000 @ $0.00015/1k + 1000 @ $0.0006/1k = 0.00015 + 0.0006 = 0.00075
      expect(calculateCost('gpt-4o-mini', 1000, 1000)).toBe(0.00075);
    });

    test('uses fallback pricing for unknown model', () => {
      // Fallback: $0.01/1k input + $0.03/1k output
      // 1000 + 1000 = 0.01 + 0.03 = 0.04
      expect(calculateCost('unknown-model', 1000, 1000)).toBe(0.04);
    });

    test('returns 0 for zero tokens', () => {
      expect(calculateCost('gpt-4o', 0, 0)).toBe(0);
    });

    test('rounds to 6 decimal places', () => {
      const result = calculateCost('gpt-4o-mini', 123, 456);
      expect(result).toBe(Math.round(result * 1_000_000) / 1_000_000);
    });
  });

  describe('calculateUtilization', () => {
    test('returns correct ratio', () => {
      expect(calculateUtilization(50, 100)).toBe(0.5);
      expect(calculateUtilization(80, 100)).toBe(0.8);
      expect(calculateUtilization(100, 100)).toBe(1.0);
    });

    test('returns 0 when limit is 0', () => {
      expect(calculateUtilization(50, 0)).toBe(0);
    });

    test('handles string inputs (Prisma Decimal)', () => {
      expect(calculateUtilization('80', '100')).toBe(0.8);
    });

    test('can exceed 1.0', () => {
      expect(calculateUtilization(110, 100)).toBe(1.1);
    });
  });

  describe('calculateRemaining', () => {
    test('returns positive remaining', () => {
      expect(calculateRemaining(30, 100)).toBe(70);
    });

    test('returns 0 when exhausted', () => {
      expect(calculateRemaining(100, 100)).toBe(0);
    });

    test('returns 0 when over budget (never negative)', () => {
      expect(calculateRemaining(110, 100)).toBe(0);
    });
  });

  describe('wouldExceedBudget', () => {
    test('returns true when cost would exceed remaining', () => {
      expect(wouldExceedBudget(90, 100, 15)).toBe(true);
    });

    test('returns false when cost fits within remaining', () => {
      expect(wouldExceedBudget(50, 100, 40)).toBe(false);
    });

    test('returns true when already exhausted', () => {
      expect(wouldExceedBudget(100, 100, 0.001)).toBe(true);
    });
  });

  describe('isWarningThreshold', () => {
    test('returns true at exactly 80%', () => {
      expect(isWarningThreshold(WARNING_THRESHOLD)).toBe(true);
    });

    test('returns true between 80% and 100%', () => {
      expect(isWarningThreshold(0.85)).toBe(true);
      expect(isWarningThreshold(0.99)).toBe(true);
    });

    test('returns false below 80%', () => {
      expect(isWarningThreshold(0.79)).toBe(false);
    });

    test('returns false at 100% (hard limit, not warning)', () => {
      expect(isWarningThreshold(HARD_LIMIT_THRESHOLD)).toBe(false);
    });
  });

  describe('isHardLimit', () => {
    test('returns true at 100%', () => {
      expect(isHardLimit(1.0)).toBe(true);
    });

    test('returns true above 100%', () => {
      expect(isHardLimit(1.1)).toBe(true);
    });

    test('returns false below 100%', () => {
      expect(isHardLimit(0.99)).toBe(false);
    });
  });
});
