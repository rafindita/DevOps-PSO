import { describe, expect, test, mock } from "bun:test";
import { render, fireEvent, screen } from "@testing-library/react";
import { FilterPanel } from "./filter-panel";
import { useSearchState } from "../../lib/search-state";
import { usePapers } from "../../lib/hooks/use-papers";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mock the hooks and router
mock.module("../../lib/search-state", () => ({
  useSearchState: mock(() => ({
    search: {
      q: "test",
      author: "",
      journal: [],
      keyword: [],
      yearFrom: "",
      yearTo: "",
    },
    setSearch: mock(),
  })),
}));

mock.module("../../lib/hooks/use-papers", () => ({
  usePapers: mock(() => ({
    data: {
      facets: {
        journals: [{ value: "Nature", count: 10 }],
        keywords: [{ value: "AI", count: 5 }],
      },
    },
    isLoading: false,
  })),
}));

const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe("FilterPanel Component", () => {
  test("should render and allow author filtering", () => {
    const { setSearch } = useSearchState();

    render(
      <MockRouter>
        <FilterPanel />
      </MockRouter>
    );

    const authorInput = screen.getByPlaceholderText("Filter by author...");
    fireEvent.change(authorInput, { target: { value: "John Doe" } });
    fireEvent.keyDown(authorInput, { key: "Enter", code: "Enter" });

    expect(setSearch).toHaveBeenCalledWith(expect.any(Function));
  });

  test("should display journal and keyword facets", () => {
    render(
      <MockRouter>
        <FilterPanel />
      </MockRouter>
    );

    expect(screen.getByText("Nature")).toBeDefined();
    expect(screen.getByText("AI")).toBeDefined();
  });
});
