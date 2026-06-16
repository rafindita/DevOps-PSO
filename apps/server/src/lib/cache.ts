import { getRedis } from "./redis";

export async function cacheGet<T>(key: string): Promise<T | null> {
	const redis = getRedis();
	if (!redis) {
		return null;
	}
	try {
		const raw = await redis.get(key);
		if (!raw) {
			return null;
		}
		return JSON.parse(raw) as T;
	} catch (err) {
		console.warn(
			`[Redis] get failed for key ${key}, bypassing cache:`,
			(err as Error).message
		);
		return null;
	}
}

export async function cacheSet<T>(
	key: string,
	value: T,
	ttlSeconds: number
): Promise<void> {
	const redis = getRedis();
	if (!redis) {
		return;
	}
	try {
		await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
	} catch (err) {
		console.warn(`[Redis] set failed for key ${key}:`, (err as Error).message);
	}
}

export async function cacheDel(pattern: string): Promise<void> {
	const redis = getRedis();
	if (!redis) {
		return;
	}
	try {
		const keys = await redis.keys(pattern);
		if (keys.length > 0) {
			await redis.del(...keys);
		}
	} catch (err) {
		console.warn(
			`[Redis] del failed for pattern ${pattern}:`,
			(err as Error).message
		);
	}
}
