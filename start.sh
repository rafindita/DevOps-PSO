#!/bin/sh
node apps/server/dist/index.js
PORT=3000 bun run apps/server/dist/index.mjs &
PORT=3001 bun run apps/web/dist/server/server.js