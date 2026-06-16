import { describe, expect, mock, test } from "bun:test";
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

describe("Auth Module", () => {
	test("POST /api/auth/register", async () => {
		const response = await authModule.handle(
			new Request("http://localhost/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "testuser", password: "password123" }),
			})
		);
		const data = await response.json();
		expect(response.status).toBe(200);
		expect(data.user.username).toBe("testuser");
	});

	test("POST /api/auth/login", async () => {
		// Override select for login to return a user
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

		const response = await authModule.handle(
			new Request("http://localhost/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "testuser", password: "password123" }),
			})
		);

		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.token).toBeDefined();
		expect(data.user.username).toBe("testuser");
	});

	test("POST /api/auth/login with wrong password", async () => {
		Bun.password.verify = mock().mockResolvedValue(false);
		const response = await authModule.handle(
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

		const response = await authModule.handle(
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

		const response = await authModule.handle(
			new Request("http://localhost/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: "existing", password: "password123" }),
			})
		);
		expect(response.status).toBe(400);
	});
});
