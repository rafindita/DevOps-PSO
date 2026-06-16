import { treaty } from "@elysiajs/eden";
import type { App } from "@scholar-seek/server";
import { useAuthStore } from "../store/auth";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3000";

export const onRequestCallback = (_path: string, options: FetchRequestInit) => {
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
