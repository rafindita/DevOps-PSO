import { Button } from "@scholar-seek/ui/components/button";
import { Checkbox } from "@scholar-seek/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@scholar-seek/ui/components/dialog";
import { Input } from "@scholar-seek/ui/components/input";
import { Separator } from "@scholar-seek/ui/components/separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api/treaty";
import { useAuthStore } from "../../lib/store/auth";

interface BookmarkButtonProps {
	className?: string;
	paperId: string;
}

export function BookmarkButton({ paperId, className }: BookmarkButtonProps) {
	const { token } = useAuthStore();
	const queryClient = useQueryClient();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newCollectionName, setNewCollectionName] = useState("");

	const { data: bookmarksData } = useQuery({
		queryKey: ["bookmarks"],
		queryFn: async () => {
			const { data, error } = await api.api.bookmarks.get();
			if (error) {
				if (error.status === 401 || error.status === 500) {
					useAuthStore.getState().logout();
				}
				throw error;
			}
			return data;
		},
		enabled: !!token,
	});

	const { data: collectionsData } = useQuery({
		queryKey: ["collections"],
		queryFn: async () => {
			const { data, error } = await api.api.collections.get();
			if (error) {
				throw error;
			}
			return data;
		},
		enabled: !!token && isModalOpen,
	});

	// Find all bookmarks for this specific paper
	const paperBookmarks =
		bookmarksData?.bookmarks?.filter(
			(b: { paper: { id: string }; collectionId: string | null; id: string }) =>
				b.paper.id === paperId
		) || [];

	const isBookmarked = paperBookmarks.length > 0;

	// Create collection
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
			setNewCollectionName("");
			toast.success("Collection created");
		},
		onError: (err: unknown) => {
			console.error("Create Collection Mutation Error:", err);
			const e = err as Record<string, unknown>;
			toast.error(
				(e?.error as string) ||
					(e?.message as string) ||
					"Failed to create collection"
			);
		},
	});

	// Toggle bookmark in a specific collection
	const toggleBookmark = useMutation({
		mutationFn: async (collectionId: string | null) => {
			const existingBookmark = paperBookmarks.find(
				(b: { collectionId: string | null; id: string }) =>
					b.collectionId === collectionId
			);

			if (existingBookmark) {
				// Remove bookmark
				const { error } = await api.api
					.bookmarks({ id: existingBookmark.id })
					.delete();
				if (error) {
					console.error("Remove Bookmark Error:", error);
					throw error.value || error;
				}
				return { action: "removed" };
			}
			// Add bookmark
			const { error } = await api.api.bookmarks.post({
				paperId,
				collectionId: collectionId || undefined,
			});
			if (error) {
				console.error("Add Bookmark Error:", error);
				throw error.value || error;
			}
			return { action: "added" };
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
			queryClient.invalidateQueries({ queryKey: ["collections"] });
			if (data.action === "removed") {
				toast.success("Bookmark removed");
			} else {
				toast.success("Bookmarked successfully");
			}
		},
		onError: (err: unknown) => {
			console.error("Toggle Bookmark Mutation Error:", err);
			const e = err as Record<string, unknown>;
			toast.error(
				(e?.error as string) ||
					(e?.message as string) ||
					"Failed to toggle bookmark"
			);
		},
	});

	return (
		<>
			<Button
				className={className}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (!token) {
						toast.error("Please login to bookmark papers");
						return;
					}
					setIsModalOpen(true);
				}}
				onMouseDown={(e) => e.stopPropagation()}
				size="icon"
				variant="ghost"
			>
				<Bookmark
					className="h-5 w-5"
					fill={isBookmarked ? "currentColor" : "none"}
				/>
			</Button>
			<Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
				<DialogContent className="w-full sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle className="text-xl">Save to Collection</DialogTitle>
					</DialogHeader>

					<div className="flex flex-col gap-4 py-4">
						{/* Uncategorized */}
						<div className="flex items-center space-x-3 py-1">
							<Checkbox
								checked={paperBookmarks.some(
									(b: { collectionId: string | null }) =>
										b.collectionId === null
								)}
								className="h-5 w-5"
								disabled={toggleBookmark.isPending}
								id={`uncategorized-${paperId}`}
								onCheckedChange={() => toggleBookmark.mutate(null)}
							/>
							<label
								className="cursor-pointer font-medium text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								htmlFor={`uncategorized-${paperId}`}
							>
								Uncategorized
							</label>
						</div>

						<Separator />

						{/* Collections List */}
						<div className="flex h-[400px] max-h-[80vh] flex-col gap-4 overflow-y-auto pr-4">
							{collectionsData?.collections?.map(
								(col: { id: string; name: string }) => (
									<div
										className="flex items-center space-x-3 py-1"
										key={col.id}
									>
										<Checkbox
											checked={paperBookmarks.some(
												(b: { collectionId: string | null }) =>
													b.collectionId === col.id
											)}
											className="h-5 w-5"
											disabled={toggleBookmark.isPending}
											id={`checkbox-${col.id}-${paperId}`}
											onCheckedChange={() => toggleBookmark.mutate(col.id)}
										/>
										<label
											className="cursor-pointer font-medium text-base leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											htmlFor={`checkbox-${col.id}-${paperId}`}
										>
											{col.name}
										</label>
									</div>
								)
							)}
						</div>

						<Separator />

						{/* Create New */}
						<div className="flex gap-2">
							<Input
								onChange={(e) => setNewCollectionName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && newCollectionName.trim()) {
										createCollection.mutate(newCollectionName.trim());
									}
								}}
								placeholder="New collection name..."
								value={newCollectionName}
							/>
							<Button
								disabled={
									!newCollectionName.trim() || createCollection.isPending
								}
								onClick={() => {
									createCollection.mutate(newCollectionName.trim());
								}}
								size="icon"
							>
								{createCollection.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<FolderPlus className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
