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
import { z } from "zod";
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
					<Link
						className="text-muted-foreground text-sm hover:underline"
						to="/search"
					>
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
