import { Toaster } from "@scholar-seek/ui/components/sonner";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Footer } from "../components/layout/footer";
import Header from "../components/layout/header";

import appCss from "../index.css?url";

export type RouterAppContext = {};

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
				content:
					"Search and discover academic papers across all scientific disciplines.",
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
