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
