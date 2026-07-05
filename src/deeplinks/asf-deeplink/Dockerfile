FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache ca-certificates && update-ca-certificates
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ── Runner (no build step — Bun runs TS directly) ─────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=app:app . .

USER app

EXPOSE 3000

CMD ["bun", "index.ts"]
