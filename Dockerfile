# Stage 1: Dependencies
FROM oven/bun:1.3.8 AS dependencies
WORKDIR /app

# Copy root config files
COPY package.json bun.lock turbo.json tsconfig.json ./

# Copy package.json of all workspaces to cache install layer
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/

RUN bun install --frozen-lockfile
COPY . .
RUN bun install

# Stage 2: Builder
FROM dependencies AS builder
WORKDIR /app
COPY . .
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1.3.8-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy built server
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# Copy built web (static assets)
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Copy necessary node_modules (monorepo root)
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Start from the root to maintain path consistency
CMD ["bun", "run", "apps/server/dist/index.mjs"]

CMD ["sh", "start.sh"]