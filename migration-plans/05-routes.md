# Phase 5: Routes

## Objective
Create all route files for home page, search page, and paper detail page using TanStack Router conventions.

## Prerequisites
- Phase 4 completed (all search components exist)
- Layout components available
- Mock data hooks available

---

## Steps

### Step 5.1: Update Home Page Route

**File**: `apps/web/src/routes/index.tsx` (overwrite)

```typescript
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Globe, Lightbulb, Microscope } from "lucide-react";
import { SearchBar } from "../components/search/search-bar";

const TOPICS = [
	{ name: "Artificial Intelligence", icon: Lightbulb, query: "AI" },
	{ name: "Climate Change", icon: Globe, query: "climate" },
	{ name: "Quantum Computing", icon: Microscope, query: "quantum" },
	{ name: "Medical Research", icon: BookOpen, query: "medicine" },
];

export const Route = createFileRoute("/")({
	component: HomeComponent,
	head: () => ({
		meta: [
			{ title: "Scholar Seek - Academic Research Discovery" },
			{
				name: "description",
				content: "Search, discover, and access thousands of peer-reviewed articles across all major scientific disciplines.",
			},
		],
	}),
});

function HomeComponent() {
	const navigate = useNavigate();

	const handleSearch = (query: string) => {
		navigate({ to: "/search", search: { q: query } });
	};

	return (
		<div className="relative flex min-h-[calc(100vh-140px)] flex-col items-center overflow-hidden px-4 py-20">
			{/* Background Glow Orbs */}
			<div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/3 animate-pulse rounded-full bg-primary/20 blur-[120px] duration-[10000ms]" />
			<div className="pointer-events-none absolute right-0 bottom-1/4 -z-10 h-[400px] w-[500px] translate-x-1/3 rounded-full bg-chart-1/15 blur-[100px]" />

			{/* Hero Section */}
			<div className="fade-in slide-in-from-bottom-8 relative mt-10 mb-16 animate-in space-y-6 text-center duration-700">
				<div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3.5 shadow-[0_0_15px_rgba(var(--primary),0.2)] ring-1 ring-primary/20">
					<BookOpen className="h-8 w-8 text-primary" />
				</div>
				<h1 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text font-extrabold text-4xl text-transparent tracking-tight md:text-7xl">
					Explore Academic Papers
				</h1>
				<p className="mx-auto max-w-2xl font-light text-lg text-muted-foreground leading-relaxed md:text-xl">
					Search, discover, and access thousands of peer-reviewed articles
					across all major scientific disciplines.
				</p>
			</div>

			{/* Search Bar container with Glassmorphism */}
			<div className="fade-in slide-in-from-bottom-6 mb-24 w-full max-w-3xl animate-in fill-mode-both delay-150 duration-700">
				<div className="group relative">
					<div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 to-chart-1/40 opacity-40 blur-md transition duration-700 group-hover:opacity-100" />
					<div className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-xl ring-1 ring-white/5 backdrop-blur-xl">
						<SearchBar onSearch={handleSearch} />
					</div>
				</div>
			</div>

			{/* Featured Topics Section */}
			<div className="fade-in slide-in-from-bottom-4 w-full max-w-5xl animate-in fill-mode-both delay-300 duration-700">
				<div className="mb-8 flex items-center justify-between">
					<h2 className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight">
						<div className="h-5 w-1.5 rounded-full bg-primary" />
						Featured Topics
					</h2>
				</div>
				<div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
					{TOPICS.map((topic) => (
						<button
							className="group flex flex-col items-center rounded-2xl border border-border/40 bg-card/50 p-8 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:bg-card/90 hover:shadow-primary/5 hover:shadow-xl"
							key={topic.name}
							onClick={() => handleSearch(topic.query)}
							type="button"
						>
							<div className="mb-5 rounded-full bg-muted/50 p-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/10">
								<topic.icon className="h-8 w-8 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
							</div>
							<span className="font-semibold text-[15px]">{topic.name}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
```

---

### Step 5.2: Create Search Page Route

**File**: `apps/web/src/routes/search/index.tsx` (create new)

```typescript
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { SearchBar } from "../../components/search/search-bar";
import { SearchResults } from "../../components/search/search-results";

const searchSchema = z.object({
	q: z.string().optional(),
	page: z.number().optional().default(1),
	pageSize: z.number().optional().default(10),
});

export const Route = createFileRoute("/search/")({
	component: SearchPage,
	validateSearch: searchSchema,
	head: ({ search }) => ({
		meta: [
			{
				title: search.q
					? `Search results for "${search.q}" - Scholar Seek`
					: "Search Papers - Scholar Seek",
			},
			{
				name: "description",
				content: search.q
					? `Find academic papers and articles related to ${search.q}.`
					: "Search for academic papers, articles, and publications.",
			},
		],
	}),
});

function SearchPage() {
	const navigate = useNavigate();
	const { q = "", page = 1, pageSize = 10 } = useSearch({ from: "/search/" });

	const handleSearch = (query: string) => {
		navigate({
			to: "/search",
			search: { q: query, page: 1, pageSize },
		});
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<div className="relative rounded-lg border bg-background shadow-sm">
					<SearchBar defaultValue={q} onSearch={handleSearch} />
				</div>
			</div>
			<SearchResults page={page} pageSize={pageSize} query={q} />
		</div>
	);
}
```

**Note**: Fix the import - need to add `useNavigate`:

```typescript
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
```

---

### Step 5.3: Create Paper Detail Route

**File**: `apps/web/src/routes/paper/$id.tsx` (create new)

```typescript
import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Badge } from "@scholar-seek/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@scholar-seek/ui/components/card";
import { Separator } from "@scholar-seek/ui/components/separator";
import { Skeleton } from "@scholar-seek/ui/components/skeleton";
import { usePaper, useRelatedPapers } from "../../lib/hooks/use-papers";
import { formatDate } from "../../lib/utils";

const paperSchema = z.object({
	id: z.string(),
});

export const Route = createFileRoute("/paper/$id")({
	component: PaperPage,
	params: {
		parse: (params) => paperSchema.parse(params),
	},
	head: ({ params }) => ({
		meta: [
			{ title: `${params.id} - Scholar Seek` },
			{ name: "description", content: "View paper details" },
		],
	}),
});

function PaperPage() {
	const { id } = Route.useParams();
	const { data: paper, isLoading, error } = usePaper(id);
	const { data: related } = useRelatedPapers(id);

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-3xl space-y-6">
					<Skeleton className="h-8 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-32 w-full" />
				</div>
			</div>
		);
	}

	if (error || !paper) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="py-12 text-center">
					<p className="text-destructive">Error loading paper</p>
					<Link className="text-primary hover:underline" to="/search">
						Back to search
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-3xl space-y-6">
				<div>
					<Link className="text-muted-foreground text-sm hover:underline" to="/search">
						← Back to search
					</Link>
					<h1 className="mt-4 font-bold text-3xl">{paper.title}</h1>
					<div className="mt-4 flex flex-wrap gap-2">
						{paper.authors.map((author) => (
							<Badge key={author} variant="secondary">
								{author}
							</Badge>
						))}
					</div>
				</div>

				<Separator />

				<Card>
					<CardHeader>
						<CardTitle>Abstract</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground leading-relaxed">
							{paper.abstract || "No abstract available"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Journal</span>
							<span>{paper.journal}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Published</span>
							<span>{formatDate(paper.publishedAt)}</span>
						</div>
						{paper.doi && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">DOI</span>
								<a
									className="text-primary hover:underline"
									href={`https://doi.org/${paper.doi}`}
									rel="noopener noreferrer"
									target="_blank"
								>
									{paper.doi}
								</a>
							</div>
						)}
						<div className="flex justify-between">
							<span className="text-muted-foreground">Source</span>
							<a
								className="text-primary hover:underline"
								href={paper.sourceUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								View original
							</a>
						</div>
					</CardContent>
				</Card>

				{paper.keywords && paper.keywords.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Keywords</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{paper.keywords.map((keyword) => (
									<Badge key={keyword} variant="outline">
										{keyword}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{related && related.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Related Papers</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{related.slice(0, 5).map((p) => (
								<Link
									className="block text-primary hover:underline"
									key={p.id}
									params={{ id: p.id }}
									to="/paper/$id"
								>
									{p.title}
								</Link>
							))}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
```

---

### Step 5.4: Update Footer "Browse All" Link

**File**: `apps/web/src/components/layout/footer.tsx` (update line 19)

Replace the placeholder `<a href="#">` with proper TanStack Router `<Link>`:

```typescript
// Before (from Phase 3 - placeholder)
<a className="transition hover:text-foreground" href="#">
    Browse All
</a>

// After
<Link className="transition hover:text-foreground" to="/search">
    Browse All
</Link>
```

This connects the footer navigation to the newly created search page.

---

### Step 5.5: Delete Old Loader Component (if needed)

**Command**:
```bash
rm apps/web/src/components/loader.tsx
```

---

## Verification Checklist

- [ ] `apps/web/src/routes/index.tsx` updated with home page
- [ ] `apps/web/src/routes/search/index.tsx` created with search page
- [ ] `apps/web/src/routes/paper/$id.tsx` created with paper detail page
- [ ] All routes use TanStack Router conventions
- [ ] `validateSearch` used for URL search params
- [ ] Dynamic routes use `$param` syntax
- [ ] Navigation uses `useNavigate()` and `Link` from TanStack Router

## Next Phase
Proceed to [Phase 6: Testing & Polish](./06-testing-polish.md)