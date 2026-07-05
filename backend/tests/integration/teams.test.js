'use strict';

process.env.DATABASE_URL   = 'postgresql://postgres:password@localhost:5432/test_abc';
process.env.JWT_SECRET     = 'test_secret_minimum_32_characters_long_!!';
process.env.OPENAI_API_KEY = 'sk-test0000000000000000000000000000000000000000000';
process.env.REDIS_URL      = 'redis://localhost:6379';
process.env.NODE_ENV       = 'test';

jest.mock('../../src/config/db', () => ({
  prisma:            {},
  connectDatabase:   jest.fn(),
  disconnectDatabase: jest.fn(),
}));
jest.mock('../../src/config/redis', () => ({
  getRedis: () => ({ ping: jest.fn() }),
  connectRedis: jest.fn(), disconnectRedis: jest.fn(),
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn(), cacheDel: jest.fn(), cacheDelPattern: jest.fn(),
}));
jest.mock('../../src/config/socket', () => ({
  initIO: jest.fn(), getIO: () => ({ emit: jest.fn(), on: jest.fn() }),
}));
jest.mock('../../src/jobs/scheduler', () => ({
  startScheduler: jest.fn(), stopScheduler: jest.fn(),
}));

// Mock team service
jest.mock('../../src/services/team.service', () => ({
  createTeam:  jest.fn(),
  listTeams:   jest.fn(),
  getTeamById: jest.fn(),
  updateTeam:  jest.fn(),
  deleteTeam:  jest.fn(),
}));

const request     = require('supertest');
const app         = require('../../src/app');
const teamService = require('../../src/services/team.service');

const sampleTeam = {
  id: 'team-uuid-1', name: 'Platform Eng', slug: 'platform-eng',
  budgetLimit: 100, budgetUsed: 0, status: 'active',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe('Teams API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/v1/teams', () => {
    test('creates a team and returns 201', async () => {
      teamService.createTeam.mockResolvedValue(sampleTeam);
      const res = await request(app)
        .post('/api/v1/teams')
        .send({ name: 'Platform Eng', slug: 'platform-eng', budget_limit: 100 });
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.slug).toBe('platform-eng');
    });

    test('returns 400 for invalid slug', async () => {
      const res = await request(app)
        .post('/api/v1/teams')
        .send({ name: 'Bad Team', slug: 'INVALID SLUG!!', budget_limit: 100 });
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/teams')
        .send({ slug: 'no-name', budget_limit: 100 });
      expect(res.statusCode).toBe(400);
    });

    test('returns 400 for negative budget', async () => {
      const res = await request(app)
        .post('/api/v1/teams')
        .send({ name: 'Test', slug: 'test', budget_limit: -10 });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/teams', () => {
    test('returns paginated team list', async () => {
      teamService.listTeams.mockResolvedValue({
        data: [sampleTeam], pagination: { total: 1, page: 1, limit: 20 },
      });
      const res = await request(app).get('/api/v1/teams');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/teams/:id', () => {
    test('returns team by ID', async () => {
      teamService.getTeamById.mockResolvedValue(sampleTeam);
      const res = await request(app).get('/api/v1/teams/team-uuid-1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe('team-uuid-1');
    });
  });

  describe('PATCH /api/v1/teams/:id', () => {
    test('updates team budget', async () => {
      teamService.updateTeam.mockResolvedValue({ ...sampleTeam, budgetLimit: 200 });
      const res = await request(app)
        .patch('/api/v1/teams/team-uuid-1')
        .send({ budget_limit: 200 });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/v1/teams/:id', () => {
    test('deletes team and returns 204', async () => {
      teamService.deleteTeam.mockResolvedValue();
      const res = await request(app).delete('/api/v1/teams/team-uuid-1');
      expect(res.statusCode).toBe(204);
    });
  });
});
