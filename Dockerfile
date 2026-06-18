# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock tsconfig.json turbo.json ./
COPY packages packages
COPY apps apps

RUN bun install --frozen-lockfile

ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN cd apps/server && bun run build

# Runtime stage
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./

ENV PORT=3000
EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "run", "dist/index.mjs"]
