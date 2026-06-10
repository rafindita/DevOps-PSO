import { expect, test, describe, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ResultCard } from "./result-card";
import React from "react";

// Mock Link from TanStack Router
mock.module("@tanstack/react-router", () => ({
  Link: ({ children, to, params, className, onClick }: any) => (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

const MOCK_PAPER = {
  id: "1",
  title: "Test Paper",
  abstract: "This is a test abstract.",
  authors: ["Author One", "Author Two"],
  publishedAt: "2021-01-01",
  journal: "Test Journal",
  doi: "10.1234/test",
  keywords: ["test"],
  sourceUrl: "https://example.com",
};

describe("ResultCard", () => {
  test("renders paper information correctly", () => {
    render(<ResultCard paper={MOCK_PAPER as any} />);
    
    expect(screen.getByText("Test Paper")).toBeDefined();
    expect(screen.getByText("Author One")).toBeDefined();
    expect(screen.getByText("Author Two")).toBeDefined();
    expect(screen.getByText(/Test Journal/)).toBeDefined();
    expect(screen.getByText("View source")).toBeDefined();
  });
});
