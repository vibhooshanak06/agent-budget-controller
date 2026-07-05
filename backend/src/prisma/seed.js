'use strict';

/**
 * seed.js — Demo data for testing and showcasing all features.
 *
 * Creates:
 *   - 2 teams with budgets
 *   - 3 agents (one near budget, one exhausted, one runaway candidate)
 *   - Active sessions for each agent
 *   - Sample usage logs with realistic token usage
 *   - Sample alerts (warning, exceeded)
 *   - Sample model substitutions
 *
 * Run: npm run db:seed
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.modelSubstitution.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.session.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.team.deleteMany();

  // ── Teams ──────────────────────────────────────────────────────────────
  const platformTeam = await prisma.team.create({
    data: {
      name:        'Platform Engineering',
      slug:        'platform-eng',
      budgetLimit: 100.00,
      budgetUsed:  67.50,
      status:      'active',
    },
  });

  const researchTeam = await prisma.team.create({
    data: {
      name:        'Research & Development',
      slug:        'research-dev',
      budgetLimit: 250.00,
      budgetUsed:  12.30,
      status:      'active',
    },
  });

  // ── Agents ─────────────────────────────────────────────────────────────
  const dataAgent = await prisma.agent.create({
    data: {
      teamId:          platformTeam.id,
      name:            'Data Extraction Agent',
      slug:            'data-extractor',
      budgetLimit:     50.00,
      budgetUsed:      42.00,    // 84% — in warning territory
      modelPreference: 'gpt-4o',
      status:          'active',
    },
  });

  const summaryAgent = await prisma.agent.create({
    data: {
      teamId:          platformTeam.id,
      name:            'Document Summarizer',
      slug:            'doc-summarizer',
      budgetLimit:     30.00,
      budgetUsed:      30.10,    // 100%+ — exhausted
      modelPreference: 'gpt-4o-mini',
      status:          'blocked',
    },
  });

  const researchAgent = await prisma.agent.create({
    data: {
      teamId:          researchTeam.id,
      name:            'Research Assistant',
      slug:            'research-assistant',
      budgetLimit:     200.00,
      budgetUsed:      12.30,
      modelPreference: 'gpt-4-turbo',
      status:          'active',
    },
  });

  // ── Sessions ────────────────────────────────────────────────────────────
  const session1 = await prisma.session.create({
    data: {
      agentId:               dataAgent.id,
      status:                'active',
      totalPromptTokens:     145000,
      totalCompletionTokens: 52000,
      totalCost:             42.00,
    },
  });

  const session2 = await prisma.session.create({
    data: {
      agentId:               summaryAgent.id,
      status:                'closed',
      totalPromptTokens:     280000,
      totalCompletionTokens: 110000,
      totalCost:             30.10,
      endedAt:               new Date(),
    },
  });

  const session3 = await prisma.session.create({
    data: {
      agentId:               researchAgent.id,
      status:                'active',
      totalPromptTokens:     40000,
      totalCompletionTokens: 15000,
      totalCost:             12.30,
    },
  });

  // ── Usage Logs ──────────────────────────────────────────────────────────
  const usageLogs = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 2 * 60 * 60 * 1000); // every 2 hours back
    usageLogs.push({
      sessionId:        session1.id,
      agentId:          dataAgent.id,
      model:            i < 10 ? 'gpt-4o' : 'gpt-4o-mini', // substituted after idx 10
      promptTokens:     Math.floor(Math.random() * 3000) + 500,
      completionTokens: Math.floor(Math.random() * 1000) + 100,
      totalTokens:      0,
      cost:             parseFloat((Math.random() * 1.4 + 0.1).toFixed(6)),
      latencyMs:        Math.floor(Math.random() * 2000) + 400,
      status:           'success',
      createdAt:        date,
    });
  }

  for (const log of usageLogs) {
    log.totalTokens = log.promptTokens + log.completionTokens;
  }

  await prisma.usageLog.createMany({ data: usageLogs });

  // ── Alerts ──────────────────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      {
        agentId:      dataAgent.id,
        teamId:       platformTeam.id,
        type:         'budget_warning',
        severity:     'warning',
        message:      `Agent "Data Extraction Agent" has used 84% of its budget.`,
        acknowledged: false,
      },
      {
        agentId:      summaryAgent.id,
        teamId:       platformTeam.id,
        type:         'budget_exceeded',
        severity:     'critical',
        message:      `Agent "Document Summarizer" has exhausted its budget. All requests are now blocked.`,
        acknowledged: false,
      },
      {
        agentId:      summaryAgent.id,
        teamId:       platformTeam.id,
        type:         'session_closed',
        severity:     'warning',
        message:      `Session for agent "Document Summarizer" was automatically closed.`,
        acknowledged: true,
      },
    ],
  });

  // ── Model Substitutions ──────────────────────────────────────────────────
  await prisma.modelSubstitution.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      agentId:        dataAgent.id,
      sessionId:      session1.id,
      requestedModel: 'gpt-4o',
      resolvedModel:  'gpt-4o-mini',
      reason:         'budget_pressure_70pct',
      utilization:    parseFloat((0.70 + i * 0.015).toFixed(4)),
      createdAt:      new Date(now.getTime() - i * 3 * 60 * 60 * 1000),
    })),
  });

  console.log('✅ Seed complete!');
  console.log(`   Teams:               2`);
  console.log(`   Agents:              3 (1 active, 1 near-limit, 1 exhausted)`);
  console.log(`   Sessions:            3`);
  console.log(`   Usage logs:          ${usageLogs.length}`);
  console.log(`   Alerts:              3`);
  console.log(`   Model substitutions: 10`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
