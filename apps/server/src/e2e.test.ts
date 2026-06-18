import { describe, expect, test, beforeAll } from "bun:test";
import app from "./index";
import { db } from "@scholar-seek/db";
import { users } from "@scholar-seek/db/schema/users";
import { eq } from "drizzle-orm";

const canConnect = process.env.DATABASE_URL ? true : false;
const itif = (condition: boolean) => (condition ? test : test.skip);

describe("True End-to-End Workflow", () => {
  let authToken = "";
  let createdUserId = "";
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: "password123",
  };
  const testPaperId = "2401.00001"; // An ID we can assume might exist

  // Cleanup hook
  beforeAll(async () => {
    if (createdUserId && canConnect) {
      await db.delete(users).where(eq(users.id, createdUserId)).catch(() => {});
    }
  });

  itif(canConnect)("1. User Registration", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toHaveProperty("id");
    createdUserId = body.user.id;
  });

  itif(canConnect)("2. User Login", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    authToken = body.token;
  });

  itif(canConnect)("3. Bookmark a Paper (Protected Route)", async () => {
    expect(authToken).not.toBeEmpty();
    const res = await app.handle(
      new Request("http://localhost/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ paperId: testPaperId }),
      })
    );
    expect(res.status).toBe(200);
  });

  itif(canConnect)("4. Verify Bookmark", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/bookmarks", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bookmarks.some((b: any) => b.paper_id === testPaperId)).toBe(true);
  });
});
