import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	username: varchar("username", { length: 255 }).unique().notNull(),
	password_hash: text("password_hash").notNull(),
	profile_picture: text("profile_picture"),
	created_at: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
