# Agent Budget Controller

An enterprise-grade AI governance layer that sits between your AI agents and LLM providers (OpenAI, Anthropic, AWS Bedrock, etc.).

Every agent request passes through this system, giving you centralized control over token consumption, costs, and runaway agent behavior before it happens — not after.

```
AI Agent
   ↓
Agent Budget Controller  ←── budget enforcement, metering, routing
   ↓
LLM Provider (OpenAI / Anthropic / AWS Bedrock)
```

---

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for:
- High-level architecture diagram (Mermaid)
- Full request flow sequence diagram
- Core module responsibilities
- Normalized database schema + ER diagram
- Complete REST API design
- Production folder structure

### Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend API | Node.js + Express | Proxy layer + governance engine |
| ORM | Prisma | Type-safe PostgreSQL access |
| Database | PostgreSQL 16 | Persistent storage for all records |
| Validation | Zod | Schema validation at every API boundary |
| Logging | Pino | Structured JSON logging |
| Containerization | Docker + Compose | Reproducible local and production deployments |

---

## Folder Structure

```
agent-budget-controller/
├── docs/
│   └── architecture.md       ← Full system design documentation
└── backend/
    ├── src/
    │   ├── config/            ← env.js, db.js, logger.js
    │   ├── controllers/       ← Thin HTTP handlers (no business logic)
    │   ├── services/          ← All domain logic and orchestration
    │   ├── repositories/      ← All Prisma/SQL queries
    │   ├── routes/            ← Express route definitions
    │   ├── middleware/        ← errorHandler, notFound, validate, requestLogger
    │   ├── validations/       ← Zod schemas per resource
    │   ├── utils/             ← AppError, asyncHandler, pagination
    │   ├── prisma/
    │   │   └── schema.prisma  ← Database schema
    │   ├── app.js             ← Express app factory
    │   └── server.js          ← HTTP server bootstrap + graceful shutdown
    ├── .env.example
    ├── docker-compose.yml
    ├── Dockerfile
    └── package.json
```

---

## Installation

### Prerequisites

- Node.js ≥ 20
- PostgreSQL 16 (or use Docker Compose)
- npm ≥ 10

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/agent-budget-controller.git
cd agent-budget-controller/backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum

# 4. Generate Prisma client
npm run db:generate

# 5. Run database migrations
npm run db:migrate

# 6. Start the development server
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `4000` | HTTP server port |
| `API_VERSION` | No | `v1` | API path prefix |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Allowed origins (comma-separated) |
| `JWT_SECRET` | **Yes** | — | Secret for signing tokens (min 32 chars) |

---

## Running Locally

### With Node directly

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### With Docker Compose

```bash
cd backend

# Start PostgreSQL + backend
docker compose up --build

# View logs
docker compose logs -f backend

# Stop
docker compose down
```

The API will be available at `http://localhost:4000`.

---

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server liveness check |
| `POST` | `/teams` | Register a new team |
| `GET` | `/teams` | List all teams |
| `GET` | `/teams/:id` | Get a team by ID |
| `POST` | `/agents` | Register a new agent |
| `GET` | `/agents` | List agents (filterable by team) |
| `GET` | `/agents/:id` | Get an agent by ID |
| `POST` | `/sessions` | Open a new agent session |
| `GET` | `/sessions/:id` | Get a session by ID |
| `POST` | `/chat` | Submit a prompt (governance proxy) |
| `GET` | `/dashboard` | Aggregated usage statistics |
| `GET` | `/alerts` | List system alerts |
| `PATCH` | `/alerts/:id/acknowledge` | Acknowledge an alert |

### Health Check Example

```bash
curl http://localhost:4000/api/v1/health
```

```json
{
  "status": "healthy",
  "timestamp": "2024-06-30T10:00:00.000Z",
  "uptime": 42.3,
  "environment": "development"
}
```

---

## Database

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply a new migration (development)
npm run db:migrate

# Apply migrations without creating new ones (production/CI)
npm run db:migrate:prod

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

---

## Coding Standards

- **JavaScript** (not TypeScript) with `'use strict'`
- **Clean Architecture**: controllers → services → repositories
- Controllers are thin — only parse `req` and send `res`
- All business logic lives in services
- All Prisma queries live in repositories
- `async/await` throughout — no callbacks
- Zod validation at every API boundary
- Structured Pino logging — no `console.log` in production code

---

## Future Milestones

| Milestone | Feature |
|-----------|---------|
| **Milestone 3** | Budget enforcement, token metering, cost tracking, real LLM calls, usage logging |
| **Milestone 4** | Model substitution — automatically downgrade to cheaper models near budget limit |
| **Milestone 5** | Dashboard analytics — burn rate, top consumers, daily breakdowns |
| **Milestone 6** | Runaway agent detection — session monitoring and automatic termination |
| **Milestone 7** | Alert dispatch — Slack, email, and webhook notifications |
| **Milestone 8** | React dashboard UI |

---

## License

MIT
