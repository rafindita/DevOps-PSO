import { Badge } from "@scholar-seek/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@scholar-seek/ui/components/card";
import { Separator } from "@scholar-seek/ui/components/separator";
import { Skeleton } from "@scholar-seek/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { usePaper, useRelatedPapers } from "../../lib/hooks/use-papers";
import { getSearchState } from "../../lib/search-state";
import { formatDate } from "../../lib/utils";

function getYear(dateString: string): string {
	return new Date(dateString).getFullYear().toString();
}

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
	const [backUrl, setBackUrl] = useState("/search");

	useEffect(() => {
		const searchState = getSearchState();
		if (searchState?.url) {
			setBackUrl(searchState.url);
		}
	}, []);

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
					<a
						className="text-muted-foreground text-sm transition-colors hover:text-foreground"
						href={backUrl}
					>
						← Back to search
					</a>
					<h1 className="mt-4 font-bold text-3xl leading-tight">
						{paper.title}
					</h1>
					<div className="mt-4 flex flex-wrap gap-1.5">
						{paper.authors.map((author) => (
							<Badge
								className="transition-all hover:scale-105 hover:bg-secondary/80"
								key={author}
								variant="secondary"
							>
								{author}
							</Badge>
						))}
					</div>
				</div>

				<Separator />

				<Card variant="elevated">
					<CardHeader>
						<CardTitle>Abstract</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground leading-relaxed">
							{paper.abstract || "No abstract available"}
						</p>
					</CardContent>
				</Card>

				<Card variant="elevated">
					<CardHeader>
						<CardTitle>Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Journal</span>
							<span className="font-medium">{paper.journal}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Published</span>
							<span className="font-medium">
								{formatDate(paper.publishedAt)}
							</span>
						</div>
						{paper.doi && (
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">DOI</span>
								<a
									className="font-medium text-primary transition-colors hover:underline"
									href={`https://doi.org/${paper.doi}`}
									rel="noopener noreferrer"
									target="_blank"
								>
									{paper.doi}
								</a>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Source</span>
							<a
								className="font-medium text-primary transition-colors hover:underline"
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
					<Card variant="elevated">
						<CardHeader>
							<CardTitle>Keywords</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-1.5">
								{paper.keywords.map((keyword) => (
									<Badge
										className="transition-all hover:scale-105 hover:bg-primary/15"
										key={keyword}
										variant="keyword"
									>
										{keyword}
									</Badge>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{related && related.length > 0 && (
					<Card variant="elevated">
						<CardHeader>
							<CardTitle>Related Papers</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{related.slice(0, 5).map((p) => (
								<Link
									className="group block rounded-lg p-3 transition-all hover:bg-muted/50"
									key={p.id}
									params={{ id: p.id }}
									to="/paper/$id"
								>
									<h3 className="line-clamp-2 font-medium text-sm transition-colors group-hover:text-primary">
										{p.title}
									</h3>
									<div className="mt-1.5 flex items-center gap-2 text-muted-foreground text-xs">
										<span>
											{p.authors[0]}
											{p.authors.length > 1 && " et al."}
										</span>
										<span className="text-border">•</span>
										<span>{getYear(p.publishedAt)}</span>
									</div>
								</Link>
							))}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
