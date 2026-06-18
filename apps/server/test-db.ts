import { db } from "@scholar-seek/db";
import { users } from "@scholar-seek/db/schema/users";

async function run() {
	try {
		console.log("Testing DB connection to users table...");
		const result = await db.select().from(users).limit(1);
		console.log("✅ DB test success. Users count:", result.length);
	} catch (err) {
		console.error("❌ DB test failed:", err);
	}
	process.exit(0);
}
run();
