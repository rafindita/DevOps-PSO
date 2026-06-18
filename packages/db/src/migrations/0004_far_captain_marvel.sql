CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"paper_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crawl_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar(255) NOT NULL,
	"source" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"papers_found" integer DEFAULT 0 NOT NULL,
	"papers_inserted" integer DEFAULT 0 NOT NULL,
	"papers_skipped" integer DEFAULT 0 NOT NULL,
	"errors" jsonb,
	"duration_ms" integer,
	"options" jsonb
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"abstract" text,
	"authors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"journal" varchar(255),
	"doi" varchar(255),
	"keywords" jsonb,
	"source_url" text NOT NULL,
	"source" varchar(100),
	"source_id" varchar(255),
	"citation_count" integer DEFAULT 0 NOT NULL,
	"embedding_stored" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "papers_doi_unique" UNIQUE("doi")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"profile_picture" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_paper_idx" ON "bookmarks" USING btree ("user_id","paper_id");--> statement-breakpoint
CREATE INDEX "crawl_history_source_idx" ON "crawl_history" USING btree ("source");--> statement-breakpoint
CREATE INDEX "crawl_history_started_at_idx" ON "crawl_history" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "crawl_history_status_idx" ON "crawl_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "papers_journal_idx" ON "papers" USING btree ("journal");--> statement-breakpoint
CREATE INDEX "papers_published_at_idx" ON "papers" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "papers_source_idx" ON "papers" USING btree ("source");--> statement-breakpoint
CREATE INDEX "papers_embedding_stored_idx" ON "papers" USING btree ("embedding_stored");--> statement-breakpoint
CREATE INDEX "papers_authors_gin_idx" ON "papers" USING gin ("authors");--> statement-breakpoint
CREATE INDEX "papers_keywords_gin_idx" ON "papers" USING gin ("keywords");--> statement-breakpoint
CREATE UNIQUE INDEX "papers_source_source_id_idx" ON "papers" USING btree ("source","source_id");