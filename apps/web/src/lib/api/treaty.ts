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
	// Replace onRequest with the headers function
	headers: () => {
		const token = useAuthStore.getState().token;
		if (token) {
			return {
				authorization: `Bearer ${token}`,
			};
		}
		return {};
	},
});

export type Api = typeof api;
