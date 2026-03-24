import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
				content:
					"Search, discover, and access thousands of peer-reviewed articles across all major scientific disciplines.",
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
