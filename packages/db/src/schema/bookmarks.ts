import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { collections } from "./collections";
import { papers } from "./papers";
import { users } from "./users";

export const bookmarks = pgTable(
	"bookmarks",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		user_id: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		paper_id: uuid("paper_id")
			.references(() => papers.id, { onDelete: "cascade" })
			.notNull(),
		collection_id: uuid("collection_id").references(() => collections.id, {
			onDelete: "set null",
		}),
		created_at: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("bookmarks_user_paper_col_idx").on(
			table.user_id,
			table.paper_id,
			table.collection_id
		),
	]
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
