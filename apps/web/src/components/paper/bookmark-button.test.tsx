import "../../test-setup";
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { useAuthStore } from "../../lib/store/auth";
import { BookmarkButton } from "./bookmark-button";

// Mock Treaty API
const postMock = mock().mockResolvedValue({
	data: { bookmark: { id: "new" } },
});
const deleteMock = mock().mockResolvedValue({ data: { message: "removed" } });
const getBookmarksMock = mock().mockResolvedValue({ data: { bookmarks: [] } });
const getCollectionsMock = mock().mockResolvedValue({
	data: { collections: [] },
});
const createCollectionMock = mock().mockResolvedValue({
	data: { collection: { id: "col2", name: "New" } },
});

const bookmarksMockFn = mock((...args: any[]) => {
	if (args[0]?.id) {
		return { delete: deleteMock };
	}
	return {};
}) as any;
bookmarksMockFn.get = getBookmarksMock;
bookmarksMockFn.post = postMock;

mock.module("../../lib/api/treaty", () => ({
	api: {
		api: {
			bookmarks: bookmarksMockFn,
			collections: { get: getCollectionsMock, post: createCollectionMock },
		},
	},
}));

// Mock Sonner Toast
mock.module("sonner", () => ({
	toast: {
		success: mock(),
		error: mock(),
	},
}));

describe("BookmarkButton", () => {
	beforeEach(() => {
		useAuthStore.setState({ token: "fake-token" });
		postMock.mockReset();
		postMock.mockResolvedValue({ data: { bookmark: { id: "new" } } });

		deleteMock.mockReset();
		deleteMock.mockResolvedValue({ data: { message: "removed" } });

		getBookmarksMock.mockReset();
		getBookmarksMock.mockResolvedValue({ data: { bookmarks: [] } });

		getCollectionsMock.mockReset();
		getCollectionsMock.mockResolvedValue({ data: { collections: [] } });

		createCollectionMock.mockReset();
		createCollectionMock.mockResolvedValue({
			data: { collection: { id: "col2", name: "New" } },
		});
	});

	const renderComponent = () =>
		render(
			<QueryClientProvider
				client={
					new QueryClient({ defaultOptions: { queries: { retry: false } } })
				}
			>
				<BookmarkButton paperId="1" />
			</QueryClientProvider>
		);

	test("interacts with the bookmark button successfully", async () => {
		getCollectionsMock.mockResolvedValue({
			data: { collections: [{ id: "col1", name: "My Collection" }] },
		});
		getBookmarksMock.mockResolvedValue({
			data: {
				bookmarks: [{ id: "bkm_1", collectionId: "col1", paper: { id: "1" } }],
			},
		});

		const { getByRole, getByText, getAllByRole, getByPlaceholderText } =
			renderComponent();

		// Open Modal
		const button = getByRole("button");
		fireEvent.click(button);

		await waitFor(() => {
			expect(getByText("My Collection")).toBeDefined();
		});

		// Remove Bookmark (My Collection is initially checked, click it to remove)
		const checkboxes = getAllByRole("checkbox");
		fireEvent.click(checkboxes[1]);

		await waitFor(() => {
			expect(deleteMock).toHaveBeenCalled();
		});

		// Add Bookmark (Uncategorized)
		fireEvent.click(checkboxes[0]);

		await waitFor(() => {
			expect(postMock).toHaveBeenCalled();
		});

		// Test Input onChange
		const input = getByPlaceholderText(
			"New collection name..."
		) as HTMLInputElement;
		const { act } = require("@testing-library/react");

		act(() => {
			fireEvent.change(input, { target: { value: "Cool Papers" } });
		});

		await waitFor(() => {
			expect(input.value).toBe("Cool Papers");
		});

		act(() => {
			fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });
		});

		await waitFor(() => {
			expect(createCollectionMock).toHaveBeenCalled();
		});
	});
});
