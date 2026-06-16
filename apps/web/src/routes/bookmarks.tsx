import { Button } from "@scholar-seek/ui/components/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Bookmark,
	Folder,
	FolderPlus,
	Inbox,
	LayoutDashboard,
	Loader2,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ResultCard } from "../components/search/result-card";
import { api } from "../lib/api/treaty";
import { useAuthStore } from "../lib/store/auth";

const bookmarksSearchSchema = z.object({
	collection: z.string().optional(),
});

export const Route = createFileRoute("/bookmarks")({
	validateSearch: bookmarksSearchSchema,
	component: BookmarksPage,
});

function BookmarksPage() {
	const { token } = useAuthStore();
	const { collection: activeCollectionId } = Route.useSearch();
	const navigate = useNavigate({ from: "/bookmarks" });
	const queryClient = useQueryClient();

	const { data: collectionsData } = useQuery({
		queryKey: ["collections"],
		queryFn: async () => {
			const { data, error } = await api.api.collections.get();
			if (error) {
				throw error;
			}
			return data;
		},
		enabled: !!token,
	});

	const { data: bookmarksData, isLoading } = useQuery({
		queryKey: ["bookmarks"],
		queryFn: async () => {
			const { data, error } = await api.api.bookmarks.get();
			if (error) {
				throw error;
			}
			return data;
		},
		enabled: !!token,
	});

	const createCollection = useMutation({
		mutationFn: async (name: string) => {
			const { data, error } = await api.api.collections.post({ name });
			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			toast.success("Folder created");
		},
		onError: (err: unknown) => {
			const e = err as Record<string, unknown>;
			toast.error((e?.error as string) || "Failed to create folder");
		},
	});

	const deleteCollection = useMutation({
		mutationFn: async (id: string) => {
			const { error } = await api.api.collections({ id }).delete();
			if (error) {
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			toast.success("Collection deleted");
			if (activeCollectionId) {
				navigate({ search: {} });
			}
		},
	});

	if (!token) {
		return (
			<div className="p-8 text-center">Please login to view bookmarks.</div>
		);
	}

	const collections = collectionsData?.collections || [];
	const bookmarks = bookmarksData?.bookmarks || [];

	// Filter bookmarks
	const filteredBookmarks = bookmarks.filter(
		(b: { collectionId: string | null }) => {
			if (activeCollectionId === "uncategorized") {
				return b.collectionId === null;
			}
			if (activeCollectionId === "") {
				return true;
			}
			return b.collectionId === activeCollectionId;
		}
	);

	return (
		<div className="container mx-auto flex flex-col gap-6 p-6 md:flex-row">
			{/* Sidebar */}
			<div className="w-full shrink-0 md:w-64">
				<div className="sticky top-6 flex flex-col gap-2">
					<div className="mb-4 flex items-center justify-between px-2">
						<h2 className="font-semibold text-lg">Folders</h2>
						<Button
							className="h-8 w-8 text-muted-foreground"
							onClick={() => {
								// biome-ignore lint/suspicious/noAlert: using browser prompt
								const name = window.prompt("Folder Name:");
								if (name) {
									createCollection.mutate(name);
								}
							}}
							size="icon"
							variant="ghost"
						>
							<FolderPlus className="h-4 w-4" />
						</Button>
					</div>

					<nav className="flex flex-col gap-1">
						<Button
							className="justify-start"
							onClick={() => navigate({ search: { collection: undefined } })}
							variant={activeCollectionId === "" ? "secondary" : "ghost"}
						>
							<LayoutDashboard className="mr-2 h-4 w-4" />
							All Bookmarks
						</Button>
						<Button
							className="justify-start"
							onClick={() =>
								navigate({ search: { collection: "uncategorized" } })
							}
							variant={
								activeCollectionId === "uncategorized" ? "secondary" : "ghost"
							}
						>
							<Inbox className="mr-2 h-4 w-4" />
							Uncategorized
						</Button>
						{collections.map(
							(col: { id: string; name: string; bookmarkCount?: number }) => (
								<div className="group flex" key={col.id}>
									<Button
										className="flex-1 justify-start"
										onClick={() => navigate({ search: { collection: col.id } })}
										variant={
											activeCollectionId === col.id ? "secondary" : "ghost"
										}
									>
										<Folder className="mr-2 h-4 w-4" />
										{col.name}
									</Button>
									<Button
										className="text-destructive opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => {
											if (
												// biome-ignore lint/suspicious/noAlert: using browser confirm
												window.confirm(
													"Are you sure you want to delete this folder? Papers will not be deleted."
												)
											) {
												deleteCollection.mutate(col.id);
											}
										}}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							)
						)}
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1">
				<h1 className="mb-6 font-bold text-3xl">
					{(() => {
						if (activeCollectionId === "") {
							return "All Bookmarks";
						}
						if (activeCollectionId === "uncategorized") {
							return "Uncategorized Papers";
						}
						return (
							collections.find(
								(c: { id: string; name: string }) => c.id === activeCollectionId
							)?.name || "Folder"
						);
					})()}
				</h1>

				{(() => {
					if (isLoading) {
						return (
							<div className="flex h-32 items-center justify-center">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
							</div>
						);
					}
					if (filteredBookmarks.length === 0) {
						return (
							<div className="rounded-xl border border-dashed bg-muted/20 py-12 text-center text-muted-foreground">
								{activeCollectionId === "" ? (
									<>
										<Bookmark className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
										<p>No bookmarked papers yet.</p>
									</>
								) : (
									<p>This folder is empty.</p>
								)}
							</div>
						);
					}
					return (
						<div className="flex flex-col gap-4">
							{filteredBookmarks.map(
								(b: { id: string; paper: Record<string, unknown> }) => (
									<ResultCard key={b.id} paper={b.paper} />
								)
							)}
						</div>
					);
				})()}
			</div>
		</div>
	);
}
