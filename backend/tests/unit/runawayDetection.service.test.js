'use strict';

/**
 * Unit tests for runawayDetection.service.js
 */

jest.mock('../../src/config/db', () => ({
  prisma: {
    agent: {
      findMany: jest.fn(),
      update:   jest.fn().mockResolvedValue({}),
    },
    usageLog: {
      aggregate: jest.fn(),
    },
    alert: {
      count:  jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'alert-1' }),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

jest.mock('../../src/config/socket', () => ({
  getIO: () => ({ emit: jest.fn() }),
}));

const { prisma } = require('../../src/config/db');
const { runScan } = require('../../src/services/runawayDetection.service');

describe('runawayDetection.service — runScan', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does nothing when no agents have budgets set', async () => {
    prisma.agent.findMany.mockResolvedValue([
      { id: 'a1', name: 'Agent A', teamId: 't1', budgetLimit: 0 },
    ]);
    const result = await runScan();
    expect(result.scanned).toBe(1);
    expect(result.detected).toBe(0);
    expect(prisma.agent.update).not.toHaveBeenCalled();
  });

  test('does not flag agent below runaway threshold', async () => {
    prisma.agent.findMany.mockResolvedValue([
      { id: 'a1', name: 'Agent A', teamId: 't1', budgetLimit: 100 },
    ]);
    // 10% hourly spend → below default 20% threshold
    prisma.usageLog.aggregate.mockResolvedValue({ _sum: { cost: 10 } });
    prisma.alert.count.mockResolvedValue(0);

    const result = await runScan();
    expect(result.detected).toBe(0);
    expect(prisma.agent.update).not.toHaveBeenCalled();
  });

  test('flags and pauses agent above runaway threshold', async () => {
    prisma.agent.findMany.mockResolvedValue([
      { id: 'a1', name: 'Runaway Agent', teamId: 't1', budgetLimit: 100 },
    ]);
    // 25% hourly spend → above default 20% threshold
    prisma.usageLog.aggregate.mockResolvedValue({ _sum: { cost: 25 } });
    prisma.alert.count.mockResolvedValue(0);

    const result = await runScan();
    expect(result.detected).toBe(1);
    expect(prisma.agent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'blocked' } }),
    );
    expect(prisma.alert.create).toHaveBeenCalled();
  });

  test('does not create duplicate alert if one already exists', async () => {
    prisma.agent.findMany.mockResolvedValue([
      { id: 'a1', name: 'Agent A', teamId: 't1', budgetLimit: 100 },
    ]);
    prisma.usageLog.aggregate.mockResolvedValue({ _sum: { cost: 25 } });
    prisma.alert.count.mockResolvedValue(1); // already has unacknowledged alert

    await runScan();
    expect(prisma.alert.create).not.toHaveBeenCalled();
  });
});
