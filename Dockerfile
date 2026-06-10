FROM oven/bun:1.3.8
WORKDIR /app

# 1. Bawa SEMUA file kodemu masuk tanpa dipisah-pisah
COPY . .

# 2. Install dependencies di tempat (Semua symlink monorepo dijamin 100% utuh)
RUN bun install --frozen-lockfile

# 3. Lakukan proses Build
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN bun run build

# 4. Buka Port 3000 untuk Azure
ENV PORT=3000
EXPOSE 3000

# 5. Jalankan server Elysia (yang otomatis akan memanggil server TanStack)
CMD ["bun", "run", "apps/server/dist/index.mjs"]
