# Phase 3: Layout Components

## Objective
Create the layout components: Header, Footer, and ThemeToggle.

## Prerequisites
- Phase 2 completed (mock data and hooks exist)
- UI components available (@scholar-seek/ui)

## Known Issues / Placeholders
1. **Barrel file (index.ts)**: Skipped due to linter performance rules - import directly from source files
2. **Footer "Browse All" link**: Uses placeholder `<a href="#">` because `/search` route is created in Phase 5 - will be updated then

---

## Steps

### Step 3.1: Create Theme Toggle Component

**File**: `apps/web/src/components/layout/theme-toggle.tsx` (create new)

```typescript
"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@scholar-seek/ui/components/button";

export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		const saved = localStorage.getItem("theme");
		if (
			saved === "dark" ||
			(!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
		) {
			setTheme("dark");
			document.documentElement.classList.add("dark");
		}
	}, []);

	const toggleTheme = () => {
		setTheme((prev) => {
			const next = prev === "light" ? "dark" : "light";
			if (next === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			localStorage.setItem("theme", next);
			return next;
		});
	};

	if (!mounted) {
		return (
			<Button
				aria-label="Toggle theme"
				size="icon"
				title="Toggle theme"
				variant="ghost"
			>
				<Sun className="h-4 w-4" />
			</Button>
		);
	}

	return (
		<Button
			aria-label="Toggle theme"
			onClick={toggleTheme}
			size="icon"
			title="Toggle theme"
			type="button"
			variant="ghost"
		>
			{theme === "light" ? (
				<Moon className="h-4 w-4" />
			) : (
				<Sun className="h-4 w-4" />
			)}
		</Button>
	);
}
```

---

### Step 3.2: Create Header Component

**File**: `apps/web/src/components/layout/header.tsx` (create new)

```typescript
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
	return (
		<header className="border-b">
			<div className="container mx-auto flex items-center justify-between px-4 py-4">
				<Link className="font-semibold text-xl" to="/">
					Scholar Seek
				</Link>
				<ThemeToggle />
			</div>
		</header>
	);
}
```

---

### Step 3.3: Create Footer Component

**File**: `apps/web/src/components/layout/footer.tsx` (create new)

```typescript
import { Link } from "@tanstack/react-router";
import { Github, Twitter } from "lucide-react";

export function Footer() {
	return (
		<footer className="border-t bg-muted/20">
			<div className="container mx-auto px-4 py-8">
				<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div className="text-center md:text-left">
						<p className="font-semibold">Scholar Seek</p>
						<p className="text-muted-foreground text-sm">
							Academic research discovery platform.
						</p>
					</div>
					<div className="flex gap-4 text-muted-foreground text-sm">
						<Link className="transition hover:text-foreground" to="/">
							Home
						</Link>
                        {/* Note: /search route doesn't exist yet - will be updated in Phase 5 */}
                        <a className="transition hover:text-foreground" href="#">
                            Browse All
                        </a>
						<a className="transition hover:text-foreground" href="#">
							About
						</a>
						<a className="transition hover:text-foreground" href="#">
							Terms
						</a>
					</div>
				</div>
				<div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 text-muted-foreground text-xs md:flex-row">
					<p>©{new Date().getFullYear()} Scholar Seek. Demo project.</p>
					<div className="flex items-center gap-4">
						<a
							className="hover:text-foreground"
							href="https://github.com"
							rel="noreferrer"
							target="_blank"
						>
							<Github className="h-4 w-4" />
						</a>
						<a
							className="hover:text-foreground"
							href="https://twitter.com"
							rel="noreferrer"
							target="_blank"
						>
							<Twitter className="h-4 w-4" />
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
```

---

### Step 3.4: Create Layout Components Index

> **SKIPPED**: This step is intentionally skipped. Barrel files (`index.ts` that re-exports modules) are flagged by our linter as a performance anti-pattern. Import components directly from their source files instead:
> 
> ```typescript
> // ❌ Avoid
> import { Header, Footer } from "../components/layout";
> 
> // ✅ Preferred
> import { Footer } from "../components/layout/footer";
> import Header from "../components/layout/header";
> ```

---

### Step 3.5: Delete Old Header

**Command**:
```bash
rm apps/web/src/components/header.tsx
```

---

### Step 3.6: Update Root Layout

**File**: `apps/web/src/routes/__root.tsx` (overwrite)

```typescript
import { Toaster } from "@scholar-seek/ui/components/sonner";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Footer } from "../components/layout/footer";
import Header from "../components/layout/header";

import appCss from "../index.css?url";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Scholar Seek - Academic Research Discovery",
			},
			{
				name: "description",
				content: "Search and discover academic papers across all scientific disciplines.",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="flex min-h-screen flex-col">
					<Header />
					<main className="flex-1">
						<Outlet />
					</main>
					<Footer />
				</div>
				<Toaster richColors />
				<TanStackRouterDevtools position="bottom-left" />
				<Scripts />
			</body>
		</html>
	);
}
```

---

## Verification Checklist

- [ ] `apps/web/src/components/layout/theme-toggle.tsx` created
- [ ] `apps/web/src/components/layout/header.tsx` created
- [ ] `apps/web/src/components/layout/footer.tsx` created
- [ ] ~~`apps/web/src/components/layout/index.ts` created~~ (skipped - barrel files are a linter anti-pattern)
- [ ] Old `apps/web/src/components/header.tsx` deleted
- [ ] `apps/web/src/routes/__root.tsx` updated with new layout
- [ ] Theme toggle works with localStorage persistence
- [ ] Header shows "Scholar Seek" branding
- [ ] Footer displays correctly

## Next Phase
Proceed to [Phase 4: Search Components](./04-search-components.md)