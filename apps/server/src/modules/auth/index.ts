import jwt from "@elysiajs/jwt";
import { db } from "@scholar-seek/db";
import { users } from "@scholar-seek/db/schema/users";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key";

export const authModule = new Elysia({ prefix: "/api/auth" })
	.use(
		jwt({
			name: "jwt",
			secret: JWT_SECRET,
		})
	)
	.post(
		"/register",
		async ({ body, set }) => {
			try {
				const { username, password } = body;

				// Check if username exists
				const existingUser = await db
					.select()
					.from(users)
					.where(eq(users.username, username))
					.limit(1);

				if (existingUser.length > 0) {
					set.status = 400;
					return { error: "Username already exists" };
				}

				const passwordHash = await Bun.password.hash(password);
				const profilePicture = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
					username
				)}`;

				const [newUser] = await db
					.insert(users)
					.values({
						username,
						password_hash: passwordHash,
						profile_picture: profilePicture,
					})
					.returning({
						id: users.id,
						username: users.username,
						profile_picture: users.profile_picture,
					});

				return { message: "User registered successfully", user: newUser };
			} catch (err: unknown) {
				const isError = err instanceof Error;
				const code =
					typeof err === "object" && err !== null && "code" in err
						? (err as Record<string, unknown>).code
						: undefined;

				if (code === "23505") {
					set.status = 400;
					return { error: "Username already taken" };
				}
				set.status = 500;
				return {
					error: "Internal Server Error",
					detail: isError ? err.message : String(err),
					stack: isError ? err.stack : undefined,
				};
			}
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
			}),
			detail: {
				summary: "Register new user",
				tags: ["auth"],
			},
		}
	)
	.post(
		"/login",
		async ({ body, set, jwt }) => {
			const { username, password } = body;

			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (!user) {
				set.status = 401;
				return { error: "Invalid username or password" };
			}

			const isValid = await Bun.password.verify(password, user.password_hash);
			if (!isValid) {
				set.status = 401;
				return { error: "Invalid username or password" };
			}

			const token = await jwt.sign({ id: user.id });

			return {
				token,
				user: {
					id: user.id,
					username: user.username,
					profile_picture: user.profile_picture,
				},
			};
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
			}),
			detail: {
				summary: "Login user",
				tags: ["auth"],
			},
		}
	);
