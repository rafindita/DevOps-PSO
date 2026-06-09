import { env } from "@scholar-seek/env/server";
import Redis from "ioredis";

let client: Redis | null = null;

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
				console.error("[redis] connection error:", err.message);
			});
		} catch (e) {
			return null;
		}
	}
	return client;
}
