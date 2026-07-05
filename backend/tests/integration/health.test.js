'use strict';

/**
 * Integration tests for health endpoints.
 * Uses supertest — no real DB/Redis/OpenAI connections needed for /health.
 */

// Provide required env vars before loading app
process.env.DATABASE_URL    = 'postgresql://postgres:password@localhost:5432/test_abc';
process.env.JWT_SECRET      = 'test_secret_minimum_32_characters_long_!!';
process.env.OPENAI_API_KEY  = 'sk-test0000000000000000000000000000000000000000000';
process.env.REDIS_URL       = 'redis://localhost:6379';
process.env.NODE_ENV        = 'test';

jest.mock('../../src/config/db', () => ({
  prisma:            { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) },
  connectDatabase:   jest.fn().mockResolvedValue(),
  disconnectDatabase: jest.fn().mockResolvedValue(),
}));

jest.mock('../../src/config/redis', () => ({
  getRedis:       () => ({ ping: jest.fn().mockResolvedValue('PONG') }),
  connectRedis:   jest.fn().mockResolvedValue(),
  disconnectRedis: jest.fn().mockResolvedValue(),
  cacheGet:       jest.fn().mockResolvedValue(null),
  cacheSet:       jest.fn().mockResolvedValue(),
  cacheDel:       jest.fn().mockResolvedValue(),
  cacheDelPattern: jest.fn().mockResolvedValue(),
}));

jest.mock('../../src/config/socket', () => ({
  initIO: jest.fn(),
  getIO:  () => ({ emit: jest.fn(), on: jest.fn() }),
}));

jest.mock('../../src/jobs/scheduler', () => ({
  startScheduler: jest.fn(),
  stopScheduler:  jest.fn(),
}));

const request = require('supertest');
const app     = require('../../src/app');

describe('GET /api/v1/health', () => {
  test('returns 200 with healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment');
  });
});

describe('GET /api/v1/health/database', () => {
  test('returns 200 when DB responds', async () => {
    const res = await request(app).get('/api/v1/health/database');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('latencyMs');
  });
});

describe('GET /api/v1/health/redis', () => {
  test('returns 200 when Redis responds', async () => {
    const res = await request(app).get('/api/v1/health/redis');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
