import { treaty } from "@elysiajs/eden";
import type { App } from "@scholar-seek/server";
import { useAuthStore } from "../store/auth";

// Otomatis pakai URL Azure di Production, dan localhost di Development
const SERVER_URL =
	import.meta.env.PROD && typeof window !== "undefined"
		? window.location.origin
		: (import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000");

export const onRequestCallback = (_path: string, options: RequestInit) => {
	const token = useAuthStore.getState().token;
	if (token) {
		options.headers = {
			...options.headers,
			Authorization: `Bearer ${token}`,
		};
	}
};

export const api = treaty<App>(SERVER_URL, {
	fetcher: globalThis.fetch,
	onRequest: onRequestCallback,
});

export type Api = typeof api;
