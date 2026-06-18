import { describe, expect, test } from "bun:test";
import { useAuthStore } from "../store/auth";
import { onRequestCallback } from "./treaty";

describe("Treaty API config", () => {
	test("onRequest injects Authorization header", () => {
		useAuthStore
			.getState()
			.setAuth(
				{ id: "1", username: "test", profile_picture: null },
				"mock-token"
			);

		const options: any = { headers: {} };
		onRequestCallback("/test", options);

		expect(options.headers.Authorization).toBe("Bearer mock-token");

		// Without token
		useAuthStore.getState().logout();
		const options2: any = { headers: {} };
		onRequestCallback("/test", options2);

		expect(options2.headers.Authorization).toBeUndefined();
	});
});
