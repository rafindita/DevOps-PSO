import { describe, expect, mock, test } from "bun:test";
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { authModule } from "./index";

// Mock the database
mock.module("@scholar-seek/db", () => ({
	db: {
		select: mock().mockReturnValue({
			from: mock().mockReturnValue({
				where: mock().mockReturnValue({
					limit: mock().mockResolvedValue([]), // No existing user
				}),
			}),
		}),
		insert: mock().mockReturnValue({
			values: mock().mockReturnValue({
				returning: mock().mockResolvedValue([
					{ id: "1", username: "testuser", profile_picture: "pic" },
				]),
			}),
		}),
	},
}));

// Mock Bun password
Bun.password.hash = mock().mockResolvedValue("hashed_password");
Bun.password.verify = mock().mockResolvedValue(true);

// Create a test app wrapper to inject JWT plugin!
const testApp = new Elysia()
	.use(
		jwt({
			name: "jwt",
			secret: "super-secret-test-key",
		})
	)
	.use(authModule);

describe("Auth Module", () => {
	test("POST /api/auth/register", async () => {
		const response = await testApp.handle(
			new Request("http://localhost/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "testuser", password: "password123" }),
			})
		);
		const data = (await response.json()) as any;
		expect(response.status).toBe(200);
		expect(data.user.username).toBe("testuser");
	});

	test("POST /api/auth/login", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				select: mock().mockReturnValue({
					from: mock().mockReturnValue({
						where: mock().mockReturnValue({
							limit: mock().mockResolvedValue([
								{
									id: "1",
									username: "testuser",
									password_hash: "hashed_password",
								},
							]),
						}),
					}),
				}),
			},
		}));

		const response = await testApp.handle(
			new Request("http://localhost/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "testuser", password: "password123" }),
			})
		);

		expect(response.status).toBe(200);
		const data = (await response.json()) as any;
		expect(data.token).toBeDefined();
		expect(data.user.username).toBe("testuser");
	});

	test("POST /api/auth/login with wrong password", async () => {
		Bun.password.verify = mock().mockResolvedValue(false);
		const response = await testApp.handle(
			new Request("http://localhost/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "testuser", password: "wrong" }),
			})
		);
		expect(response.status).toBe(401);
	});

	test("POST /api/auth/login with non-existent user", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				select: mock().mockReturnValue({
					from: mock().mockReturnValue({
						where: mock().mockReturnValue({
							limit: mock().mockResolvedValue([]),
						}),
					}),
				}),
			},
		}));

		const response = await testApp.handle(
			new Request("http://localhost/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "nobody", password: "password123" }),
			})
		);
		expect(response.status).toBe(401);
	});

	test("POST /api/auth/register with existing username", async () => {
		mock.module("@scholar-seek/db", () => ({
			db: {
				select: mock().mockReturnValue({
					from: mock().mockReturnValue({
						where: mock().mockReturnValue({
							limit: mock().mockResolvedValue([{ id: "1" }]),
						}),
					}),
				}),
			},
		}));

		const response = await testApp.handle(
			new Request("http://localhost/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "existing", password: "password123" }),
			})
		);
		expect(response.status).toBe(400);
	});
});