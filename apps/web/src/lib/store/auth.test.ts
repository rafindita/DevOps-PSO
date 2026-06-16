import { describe, expect, test } from "bun:test";
import { useAuthStore } from "./auth";

describe("Auth Store", () => {
	test("sets and clears auth state correctly", () => {
		useAuthStore.getState().logout();
		// Initial state
		expect(useAuthStore.getState().token).toBeNull();
		expect(useAuthStore.getState().user).toBeNull();

		// Set Auth
		useAuthStore
			.getState()
			.setAuth(
				{ id: "1", username: "testuser", profile_picture: null },
				"fake-token"
			);
		expect(useAuthStore.getState().token).toBe("fake-token");
		expect(useAuthStore.getState().user?.username).toBe("testuser");

		// Logout
		useAuthStore.getState().logout();
		expect(useAuthStore.getState().token).toBeNull();
		expect(useAuthStore.getState().user).toBeNull();

		// Set Active Job Id
		useAuthStore.getState().setActiveJobId("job-123");
		expect(useAuthStore.getState().activeJobId).toBe("job-123");
	});
});
