'use strict';

/**
 * Unit tests for modelRouter.service.js — resolveModel logic.
 * DB calls are mocked so no database connection is required.
 */

jest.mock('../../src/repositories/modelSubstitution.repository', () => ({
  createSubstitution: jest.fn().mockResolvedValue({}),
  listSubstitutions:  jest.fn(),
  countSubstitutionsSince: jest.fn(),
}));

jest.mock('../../src/config/socket', () => ({
  getIO: () => ({ emit: jest.fn() }),
}));

const { resolveModel } = require('../../src/services/modelRouter.service');

const makeAgent = (budgetUsed, budgetLimit) => ({
  id: 'agent-uuid-1',
  name: 'Test Agent',
  teamId: 'team-uuid-1',
  budgetUsed,
  budgetLimit,
});

describe('modelRouter.service — resolveModel', () => {
  test('returns the requested model when utilization is below all thresholds', async () => {
    const agent = makeAgent(30, 100); // 30% utilization
    const result = await resolveModel({ requestedModel: 'gpt-4o', agent });
    expect(result.resolvedModel).toBe('gpt-4o');
    expect(result.substituted).toBe(false);
  });

  test('substitutes gpt-4o → gpt-4o-mini at 70% utilization', async () => {
    const agent = makeAgent(72, 100); // 72% — above first 0.70 threshold
    const result = await resolveModel({ requestedModel: 'gpt-4o', agent });
    expect(result.resolvedModel).toBe('gpt-4o-mini');
    expect(result.substituted).toBe(true);
  });

  test('substitutes gpt-4o → gpt-3.5-turbo at 90% utilization', async () => {
    const agent = makeAgent(91, 100); // 91% — above second 0.90 threshold
    const result = await resolveModel({ requestedModel: 'gpt-4o', agent });
    expect(result.resolvedModel).toBe('gpt-3.5-turbo');
    expect(result.substituted).toBe(true);
  });

  test('no substitution when model has no fallback chain', async () => {
    const agent = makeAgent(95, 100); // gpt-3.5-turbo has empty chain
    const result = await resolveModel({ requestedModel: 'gpt-3.5-turbo', agent });
    expect(result.resolvedModel).toBe('gpt-3.5-turbo');
    expect(result.substituted).toBe(false);
  });

  test('no substitution when budgetLimit is 0 (unlimited)', async () => {
    const agent = makeAgent(0, 0); // limit=0 → utilization=0
    const result = await resolveModel({ requestedModel: 'gpt-4o', agent });
    expect(result.resolvedModel).toBe('gpt-4o');
    expect(result.substituted).toBe(false);
  });

  test('persists substitution record when substitution occurs', async () => {
    const subRepo = require('../../src/repositories/modelSubstitution.repository');
    subRepo.createSubstitution.mockClear();

    const agent = makeAgent(75, 100);
    await resolveModel({ requestedModel: 'gpt-4o', agent, sessionId: 'sess-1' });

    // createSubstitution called asynchronously — wait a tick
    await new Promise((r) => setTimeout(r, 10));
    expect(subRepo.createSubstitution).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedModel: 'gpt-4o',
        resolvedModel:  'gpt-4o-mini',
        agentId:        'agent-uuid-1',
        sessionId:      'sess-1',
      }),
    );
  });
});
