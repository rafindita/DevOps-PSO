import { env } from "@scholar-seek/env/server";
import Redis from "ioredis";

let client: Redis | null = null;
let hasLoggedError = false;

export function getRedis(): Redis | null {
	if (!client) {
		try {
			client = new Redis(env.REDIS_URL, {
				maxRetriesPerRequest: 0,
				lazyConnect: true,
				tls: {},
				enableOfflineQueue: false,
			});

			client.on("error", (err) => {
				if (!hasLoggedError) {
					console.warn(
						"[Redis] Connection error (gracefully handled):",
						err.message
					);
					hasLoggedError = true;
				}
			});

			client.on("connect", () => {
				if (hasLoggedError) {
					console.info("[Redis] Connection restored.");
					hasLoggedError = false;
				}
			});
		} catch (_e) {
			return null;
		}
	}
	return client;
}
