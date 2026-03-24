"use client";

import { Button } from "@scholar-seek/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		if (document.documentElement.classList.contains("dark")) {
			setTheme("dark");
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
