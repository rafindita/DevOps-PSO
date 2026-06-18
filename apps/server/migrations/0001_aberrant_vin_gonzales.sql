CREATE INDEX "papers_authors_gin_idx" ON "papers" USING gin ("authors");--> statement-breakpoint
CREATE INDEX "papers_keywords_gin_idx" ON "papers" USING gin ("keywords");