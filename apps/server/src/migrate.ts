import { db } from "@scholar-seek/db";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
	console.log("Running database migrations...");
	try {
		await migrate(db, { migrationsFolder: "./migrations" });
		console.log("Migrations completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed!", error);
		process.exit(1);
	}
}

main();
