import { env } from "@scholar-seek/env/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { bookmarks as bookmarksSchema } from "./schema/bookmarks";
// Schema import
import { collections as collectionsSchema } from "./schema/collections";
import { crawlHistory as crawlHistorySchema } from "./schema/crawl-history";
import { papers as papersSchema } from "./schema/papers";
import { users as usersSchema } from "./schema/users";

const schema = {
	...papersSchema,
	...crawlHistorySchema,
	...usersSchema,
	...bookmarksSchema,
	...collectionsSchema,
};

export const db = drizzle(env.DATABASE_URL, { schema });
