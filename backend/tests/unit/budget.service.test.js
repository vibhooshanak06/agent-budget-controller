'use strict';

/**
 * Unit tests for budget.service.js — pure business logic.
 * All external dependencies mocked.
 */

jest.mock('../../src/repositories/session.repository');
jest.mock('../../src/repositories/agent.repository');
jest.mock('../../src/repositories/team.repository');
jest.mock('../../src/services/alert.service', () => ({
  emitBudgetWarning:  jest.fn().mockResolvedValue(null),
  emitBudgetExceeded: jest.fn().mockResolvedValue(null),
  emitSessionClosed:  jest.fn().mockResolvedValue(null),
  ALERT_TYPES:        { BUDGET_WARNING: 'budget_warning', BUDGET_EXCEEDED: 'budget_exceeded' },
}));

const sessionRepo = require('../../src/repositories/session.repository');
const agentRepo   = require('../../src/repositories/agent.repository');
const teamRepo    = require('../../src/repositories/team.repository');
const alertSvc    = require('../../src/services/alert.service');
const AppError    = require('../../src/utils/AppError');
const budget      = require('../../src/services/budget.service');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const activeSession = {
  id: 'sess-1', agentId: 'agent-1', status: 'active',
  totalCost: 5, totalPromptTokens: 1000, totalCompletionTokens: 400,
};
const closedSession = { ...activeSession, status: 'closed' };

const healthyAgent = {
  id: 'agent-1', name: 'Agent A', teamId: 'team-1',
  budgetLimit: 100, budgetUsed: 30, status: 'active',
  team: { id: 'team-1', name: 'Team A', budgetLimit: 500, budgetUsed: 100 },
};
const warningAgent = { ...healthyAgent, budgetUsed: 85 };  // 85%
const exhaustedAgent = { ...healthyAgent, budgetUsed: 101 }; // 101%

// ── buildSnapshot ─────────────────────────────────────────────────────────────

describe('budget.service — buildSnapshot', () => {
  test('correctly computes snapshot for healthy entity', () => {
    const snap = budget.buildSnapshot('Test', 100, 30);
    expect(snap.used).toBe(30);
    expect(snap.limit).toBe(100);
    expect(snap.remaining).toBe(70);
    expect(snap.utilization).toBeCloseTo(0.3);
    expect(snap.utilizationPct).toBe(30);
    expect(snap.isWarning).toBe(false);
    expect(snap.isExhausted).toBe(false);
  });

  test('marks isWarning at 80%', () => {
    const snap = budget.buildSnapshot('Test', 100, 82);
    expect(snap.isWarning).toBe(true);
    expect(snap.isExhausted).toBe(false);
  });

  test('marks isExhausted at 100%', () => {
    const snap = budget.buildSnapshot('Test', 100, 100);
    expect(snap.isExhausted).toBe(true);
  });

  test('handles string decimals (Prisma output)', () => {
    const snap = budget.buildSnapshot('Test', '100.000000', '50.000000');
    expect(snap.utilization).toBeCloseTo(0.5);
  });
});

// ── checkSessionBudget ────────────────────────────────────────────────────────

describe('budget.service — checkSessionBudget', () => {
  test('passes for active session', async () => {
    await expect(budget.checkSessionBudget(activeSession, healthyAgent))
      .resolves.toBeUndefined();
  });

  test('throws SESSION_CLOSED for closed session', async () => {
    await expect(budget.checkSessionBudget(closedSession, healthyAgent))
      .rejects.toMatchObject({ code: 'SESSION_CLOSED', statusCode: 403 });
  });
});

// ── checkAgentBudget ──────────────────────────────────────────────────────────

describe('budget.service — checkAgentBudget', () => {
  beforeEach(() => jest.clearAllMocks());

  test('passes when budget is healthy', async () => {
    await expect(budget.checkAgentBudget(healthyAgent)).resolves.toBeUndefined();
    expect(alertSvc.emitBudgetWarning).not.toHaveBeenCalled();
  });

  test('emits warning alert but does not throw at 85%', async () => {
    await expect(budget.checkAgentBudget(warningAgent)).resolves.toBeUndefined();
    await new Promise((r) => setTimeout(r, 10));
    expect(alertSvc.emitBudgetWarning).toHaveBeenCalled();
  });

  test('throws AGENT_BUDGET_EXHAUSTED at 101%', async () => {
    await expect(budget.checkAgentBudget(exhaustedAgent))
      .rejects.toMatchObject({ code: 'AGENT_BUDGET_EXHAUSTED', statusCode: 403 });
  });

  test('passes when budgetLimit is 0 (unlimited)', async () => {
    const unlimitedAgent = { ...healthyAgent, budgetLimit: 0 };
    await expect(budget.checkAgentBudget(unlimitedAgent)).resolves.toBeUndefined();
  });
});

// ── checkTeamBudget ───────────────────────────────────────────────────────────

describe('budget.service — checkTeamBudget', () => {
  const healthyTeam    = { id: 'team-1', name: 'Team A', budgetLimit: 500, budgetUsed: 100 };
  const exhaustedTeam  = { ...healthyTeam, budgetUsed: 505 };

  test('passes for healthy team', async () => {
    await expect(budget.checkTeamBudget(healthyTeam)).resolves.toBeUndefined();
  });

  test('throws TEAM_BUDGET_EXHAUSTED for exhausted team', async () => {
    await expect(budget.checkTeamBudget(exhaustedTeam))
      .rejects.toMatchObject({ code: 'TEAM_BUDGET_EXHAUSTED', statusCode: 403 });
  });
});

// ── assertRequestAllowed ──────────────────────────────────────────────────────

describe('budget.service — assertRequestAllowed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionRepo.findSessionById.mockResolvedValue(activeSession);
    agentRepo.findAgentWithTeam.mockResolvedValue(healthyAgent);
  });

  test('returns session/agent/team when all checks pass', async () => {
    const result = await budget.assertRequestAllowed('sess-1', 'agent-1');
    expect(result.session).toEqual(activeSession);
    expect(result.agent).toEqual(healthyAgent);
    expect(result.team).toBeDefined();
  });

  test('throws NOT_FOUND when session missing', async () => {
    sessionRepo.findSessionById.mockResolvedValue(null);
    await expect(budget.assertRequestAllowed('bad-sess', 'agent-1'))
      .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  test('throws NOT_FOUND when agent missing', async () => {
    agentRepo.findAgentWithTeam.mockResolvedValue(null);
    await expect(budget.assertRequestAllowed('sess-1', 'bad-agent'))
      .rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  test('throws SESSION_AGENT_MISMATCH when IDs do not match', async () => {
    agentRepo.findAgentWithTeam.mockResolvedValue({ ...healthyAgent, id: 'different-agent' });
    await expect(budget.assertRequestAllowed('sess-1', 'different-agent'))
      .rejects.toMatchObject({ code: 'SESSION_AGENT_MISMATCH' });
  });
});
