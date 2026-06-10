FROM oven/bun:1.3.8
WORKDIR /app

# Copy semua file ke dalam container
COPY . .

# Install semua deps termasuk symlink monorepo
RUN bun install --frozen-lockfile

# Build semua package
RUN bun run build

# Port 3000
EXPOSE 3000

# Jalankan server API (yang nantinya akan memanggil server frontend)
CMD ["bun", "run", "apps/server/dist/index.mjs"]