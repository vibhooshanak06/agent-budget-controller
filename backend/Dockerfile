# ──────────────────────────────────────────────────────────────────────────────
# Agent Budget Controller — Dockerfile
# Multi-stage build for minimal production image size.
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first to leverage Docker layer cache
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev

# ── Stage 2: Build (Prisma client generation) ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Generate Prisma client from schema
RUN npx prisma generate --schema=src/prisma/schema.prisma

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

# Copy only what's needed at runtime
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/src ./src
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

EXPOSE 4000

# Health check for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
