# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lock tsconfig.json turbo.json ./

# Copy workspace packages
COPY packages packages
COPY apps apps

# Install dependencies
RUN bun install

# Build the web app
RUN cd apps/web && bun run build

# Runtime stage
FROM oven/bun:1-alpine

WORKDIR /app/apps/web

# Copy built artifacts from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/dist ./dist

# Expose port
EXPOSE 3001

# Run the TanStack Start server handler through Bun's HTTP server
CMD ["bun", "-e", "import server from './dist/server/server.js'; Bun.serve({ port: 3001, fetch: server.fetch });"]
