import { Badge } from "@scholar-seek/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@scholar-seek/ui/components/card";
import { formatDate } from "../../lib/utils";
import type { Paper } from "../../types/paper";

interface ResultCardProps {
	paper: Paper;
}

export function ResultCard({ paper }: ResultCardProps) {
	return (
		<Card className="transition-colors hover:border-primary">
			<CardHeader>
				<CardTitle className="line-clamp-2 text-lg">{paper.title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="line-clamp-2 text-muted-foreground text-sm">
					{paper.abstract}
				</p>
				<div className="mt-2 flex flex-wrap gap-1">
					{paper.authors.slice(0, 3).map((author) => (
						<Badge key={author} variant="secondary">
							{author}
						</Badge>
					))}
					{paper.authors.length > 3 && (
						<Badge variant="outline">+{paper.authors.length - 3}</Badge>
					)}
				</div>
				<div className="flex items-center justify-between pt-2 text-muted-foreground text-xs">
					<span>
						{paper.journal} • {formatDate(paper.publishedAt)}
					</span>
					<a
						className="text-primary hover:underline"
						href={paper.sourceUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						View source
					</a>
				</div>
			</CardContent>
		</Card>
	);
}
