# Agent Budget Controller — Setup Guide

## Prerequisites

Since Docker is not available on your system, you'll need to install PostgreSQL and Redis locally.

### Option 1: Using WSL2 (Recommended for Windows)

If you have WSL2 installed, you can run PostgreSQL and Redis inside WSL:

```bash
# In WSL terminal
sudo apt update
sudo apt install postgresql postgresql-contrib redis-server

# Start services
sudo service postgresql start
sudo service redis-server start

# Create database
sudo -u postgres psql -c "CREATE DATABASE agent_budget_controller;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
```

### Option 2: Native Windows Installation

#### PostgreSQL
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (accept defaults, set password as `password` for easy setup)
3. During installation, note the port (default: 5432)

#### Redis
1. Download from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use Memurai (Redis-compatible): https://www.memurai.com/

### Option 3: Docker Desktop (Easiest)

Install Docker Desktop for Windows:
1. Download from: https://www.docker.com/products/docker-desktop
2. Install and restart
3. Then run from backend folder:
   ```bash
   docker-compose up postgres redis
   ```

---

## Setup Steps

### 1. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` — PostgreSQL connection string
- `OPENAI_API_KEY` — Get from https://platform.openai.com/api-keys
- `JWT_SECRET` — Any random 32+ character string

Example `.env`:
```env
NODE_ENV=development
PORT=4000
API_VERSION=v1
DATABASE_URL=postgresql://postgres:password@localhost:5432/agent_budget_controller
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=your_super_secret_key_here_at_least_32_chars_long_12345678
OPENAI_API_KEY=sk-your-openai-api-key-here
DEFAULT_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=30000
REDIS_URL=redis://localhost:6379
REDIS_TTL_SECONDS=300
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
CRON_RUNAWAY_DETECTION=0 * * * *
CRON_DAILY_CLEANUP=0 2 * * *
CRON_MONTHLY_RESET=0 0 1 * *
RUNAWAY_THRESHOLD_PCT=20
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Run Database Migrations

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:seed        # (Optional) Seed with example data
```

### 4. Start Backend Server

```bash
npm run dev            # Development mode with auto-reload
# or
npm start              # Production mode
```

Server will start on: http://localhost:4000

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 6. Start Frontend Dev Server

```bash
npm run dev
```

Frontend will start on: http://localhost:3000

---

## Verify Installation

### Check Backend Health
```bash
curl http://localhost:4000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "uptime": 1.234,
  "environment": "development",
  "version": "2.0.0"
}
```

### Check Database Connection
```bash
curl http://localhost:4000/api/v1/health/database
```

### Check Redis Connection
```bash
curl http://localhost:4000/api/v1/health/redis
```

### Check OpenAI Connection
```bash
curl http://localhost:4000/api/v1/health/openai
```

---

## Quick Start Guide

Once both servers are running:

1. **Open Frontend**: Navigate to http://localhost:3000
2. **Create a Team**: Click Teams → (would need to implement create form or use API)
3. **Create an Agent**: Click Agents → (would need to implement create form or use API)
4. **Start a Session**: Use the API to create a session
5. **Send Chat Requests**: Use the `/api/v1/chat` endpoint

### Example API Usage

```bash
# Create a team
curl -X POST http://localhost:4000/api/v1/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team",
    "slug": "my-team",
    "budget_limit": 10.00
  }'

# Create an agent
curl -X POST http://localhost:4000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "<TEAM_ID>",
    "name": "My Agent",
    "slug": "my-agent",
    "budget_limit": 5.00,
    "model_preference": "gpt-4o-mini"
  }'

# Create a session
curl -X POST http://localhost:4000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "<AGENT_ID>"
  }'

# Send a chat request
curl -X POST http://localhost:4000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<SESSION_ID>",
    "agent_id": "<AGENT_ID>",
    "model": "gpt-4o-mini",
    "prompt": "Hello! Say hi in 5 words."
  }'
```

---

## Troubleshooting

### Port Already in Use

If ports 4000 or 3000 are occupied:

**Backend**: Edit `.env` and change `PORT=4000` to another port
**Frontend**: Edit `vite.config.js` and change `server.port: 3000`

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   # Windows (if installed as service)
   Get-Service -Name "postgresql*"
   
   # Or check if port is open
   Test-NetConnection localhost -Port 5432
   ```

2. Check connection string in `.env` matches your PostgreSQL setup

3. Try connecting manually:
   ```bash
   psql -h localhost -U postgres -d agent_budget_controller
   ```

### Redis Connection Failed

1. Verify Redis is running (port 6379)
2. Backend will continue to work without Redis (caching will be skipped)

### OpenAI API Errors

1. Verify API key is valid: https://platform.openai.com/api-keys
2. Check you have credits: https://platform.openai.com/usage
3. Test key manually:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

---

## Next Steps

- Add create/edit forms in the frontend for Teams, Agents, Sessions
- Set up production deployment (AWS, Vercel, Railway, etc.)
- Configure alerts (email, Slack webhooks)
- Add authentication middleware
- Run the full test suite

For more details, see:
- `/docs/architecture.md` — System design
- `/MILESTONES_3_4.md` — Implementation status
- `/backend/README.md` — API documentation
