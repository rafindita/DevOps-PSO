// apps/web/src/lib/api/treaty.ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@scholar-seek/server";
import { useAuthStore } from "../store/auth";

const SERVER_URL =
	import.meta.env.PROD && typeof window !== "undefined"
		? window.location.origin
		: (import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000");

export const api = treaty<App>(SERVER_URL, {
	fetcher: globalThis.fetch,
	onRequest: (_path, options) => {
		const token = useAuthStore.getState().token;
		if (token) {
			if (!options.headers) {
				options.headers = {};
			}
			if (options.headers instanceof Headers) {
				options.headers.set("authorization", `Bearer ${token}`);
			} else if (Array.isArray(options.headers)) {
				options.headers.push(["authorization", `Bearer ${token}`]);
			} else {
				// @ts-expect-error
				options.headers.authorization = `Bearer ${token}`;
			}
		}
	},
});

export type Api = typeof api;
