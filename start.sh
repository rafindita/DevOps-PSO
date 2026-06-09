#!/bin/sh
PORT=3001 bun run apps/server/dist/index.mjs &
bun run apps/web/dist/server/server.js