import { env } from "@scholar-seek/env/server";
import Redis from "ioredis";

let client: Redis | null = null;
let hasLoggedError = false;

export function getRedis(): Redis | null {
	if (!client) {
		try {
			const isSsl = env.REDIS_URL.startsWith("rediss://");
			client = new Redis(env.REDIS_URL, {
				maxRetriesPerRequest: 0,
				lazyConnect: true,
				tls: isSsl ? {} : undefined,
				enableOfflineQueue: false,
				connectTimeout: 5000,
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
