import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const collections = pgTable("collections", {
	id: uuid("id").defaultRandom().primaryKey(),
	user_id: uuid("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	created_at: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
