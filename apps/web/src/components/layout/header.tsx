import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@scholar-seek/ui/components/avatar";
import { Button } from "@scholar-seek/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@scholar-seek/ui/components/dialog";
import { Input } from "@scholar-seek/ui/components/input";
import { Label } from "@scholar-seek/ui/components/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@scholar-seek/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api/treaty";
import { useAuthStore } from "../../lib/store/auth";
import { formatDate } from "../../lib/utils";
import { ThemeToggle } from "./theme-toggle";

// biome-ignore lint/correctness/noUnusedImports: for demo purposes
function AuthSection() {
	const [isMounted, setIsMounted] = useState(false);
	const { user, setAuth, logout } = useAuthStore();
	const [isOpen, setIsOpen] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async () => {
		const { data, error: apiError } = await api.api.auth.login.post({
			username,
			password,
		});
		if (apiError) {
			const errorMsg =
				typeof apiError.value === "string"
					? apiError.value
					: (apiError.value as Record<string, unknown>)?.error ||
						"Authentication failed";
			setError(String(errorMsg));
			return;
		}
		if (data?.user && data?.token) {
			// biome-ignore lint/suspicious/noExplicitAny: treaty type issue
			setAuth(data.user as any, data.token);
			setIsOpen(false);
		}
	};

	const handleRegister = async () => {
		const { data, error: apiError } = await api.api.auth.register.post({
			username,
			password,
		});
		if (apiError) {
			const errorMsg =
				typeof apiError.value === "string"
					? apiError.value
					: (apiError.value as Record<string, unknown>)?.error ||
						"Registration failed";
			setError(String(errorMsg));
			return;
		}
		if (data?.user) {
			const { data: loginData, error: loginError } =
				await api.api.auth.login.post({ username, password });
			if (loginError || !loginData?.token) {
				setError("Registered successfully! Please login.");
				return;
			}
			// biome-ignore lint/suspicious/noExplicitAny: treaty type issue
			setAuth(loginData.user as any, loginData.token);
			setIsOpen(false);
		}
	};

	const handleAuth = async (isLogin: boolean) => {
		try {
			setIsLoading(true);
			setError("");
			if (isLogin) {
				await handleLogin();
			} else {
				await handleRegister();
			}
		} catch (_e: unknown) {
			setError("An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	if (user) {
		return (
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<Avatar className="h-8 w-8">
						<AvatarImage alt={user.username} src={user.profile_picture || ""} />
						<AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
					</Avatar>
					<span className="font-medium text-sm">{user.username}</span>
				</div>
				<Button render={<Link to="/bookmarks" />} size="sm" variant="outline">
					Bookmarks
				</Button>
				<Button onClick={logout} size="sm" variant="outline">
					Logout
				</Button>
			</div>
		);
	}

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger render={<Button size="sm" variant="outline" />}>
				Login / Register
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Account</DialogTitle>
				</DialogHeader>

				<Tabs className="w-full" defaultValue="login">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="login">Login</TabsTrigger>
						<TabsTrigger value="register">Register</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-4 py-4" value="login">
						<div className="space-y-2">
							<Label htmlFor="login-username">Username</Label>
							<Input
								id="login-username"
								onChange={(e) => setUsername(e.target.value)}
								placeholder="johndoe"
								value={username}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="login-password">Password</Label>
							<Input
								id="login-password"
								onChange={(e) => setPassword(e.target.value)}
								type="password"
								value={password}
							/>
						</div>
						{error && <p className="text-red-500 text-sm">{error}</p>}
						<Button
							className="w-full"
							disabled={isLoading}
							onClick={() => handleAuth(true)}
						>
							{isLoading ? "Logging in..." : "Login"}
						</Button>
					</TabsContent>

					<TabsContent className="space-y-4 py-4" value="register">
						<div className="space-y-2">
							<Label htmlFor="reg-username">Username</Label>
							<Input
								id="reg-username"
								onChange={(e) => setUsername(e.target.value)}
								placeholder="johndoe"
								value={username}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="reg-password">Password</Label>
							<Input
								id="reg-password"
								onChange={(e) => setPassword(e.target.value)}
								type="password"
								value={password}
							/>
						</div>
						{error && <p className="text-red-500 text-sm">{error}</p>}
						<Button
							className="w-full"
							disabled={isLoading}
							onClick={() => handleAuth(false)}
						>
							{isLoading ? "Registering..." : "Register"}
						</Button>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

function ScrapingSection() {
	const [isMounted, setIsMounted] = useState(false);
	const queryClient = useQueryClient();
	const { activeJobId, setActiveJobId } = useAuthStore();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const { data: crawlData, isLoading: crawlLoading } = useQuery({
		queryKey: ["crawl-last-updated"],
		queryFn: async () => {
			const { data, error } = await api.api.crawl["last-updated"].get();
			if (error) {
				// ✅ Don't auto-logout on 401 — crawl endpoint failing shouldn't sign the user out
				if (error.status === 404) {
					return null;
				}
				throw error;
			}
			return data;
		},
	});

	// Polling Query
	const { data: _statusData } = useQuery({
		queryKey: ["crawl-status", activeJobId],
		queryFn: async () => {
			if (!activeJobId) {
				return null;
			}
			// Pass jobId dynamically in the path
			const { data, error } = await api.api.crawl
				.status({ jobId: activeJobId })
				.get();
			if (error) {
				// ✅ Don't auto-logout on 401 — crawl endpoint failing shouldn't sign the user out
				if (error.status === 404) {
					setActiveJobId(null);
				}
				throw error;
			}

			// If finished, reset job and invalidate caches
			if (data && (data.status === "completed" || data.status === "failed")) {
				setActiveJobId(null);
				queryClient.invalidateQueries({ queryKey: ["crawl-last-updated"] });
				queryClient.invalidateQueries({ queryKey: ["papers"] });

				if (data.status === "completed") {
					toast.success(
						`Scraping complete! Found ${data.papersFound || 0} new papers.`
					);
				} else {
					toast.error("Scraping failed.");
				}
			}
			return data;
		},
		enabled: !!activeJobId,
		// In TanStack query v5, refetchInterval can accept the query object directly.
		refetchInterval: (query) => {
			const data = query.state.data as Record<string, unknown>;
			return data?.status === "running" || data?.status === "pending" || !data
				? 2000
				: false;
		},
	});

	const mutation = useMutation({
		mutationFn: async () => {
			const { data, error } = await api.api.crawl.start.post({
				source: "arxiv",
			});
			if (error) {
				throw error;
			}
			return data;
		},
		onSuccess: (data: Record<string, unknown>) => {
			if (data?.jobId) {
				setActiveJobId(data.jobId as string);
				toast.info("Scraping started in the background...");
			} else {
				queryClient.invalidateQueries({ queryKey: ["crawl-last-updated"] });
			}
		},
	});

	// Simple 30-min auto-refresh
	useEffect(() => {
		// Timer otomatis jalan setiap 30 menit (30 * 60 * 1000 milidetik)
		const intervalId = setInterval(
			() => {
				console.log("[Auto-Refresh] Triggering background scraping...");
				mutation.mutate();
			},
			30 * 60 * 1000
		);

		// Cleanup function biar memori browser nggak bocor kalau pindah halaman
		return () => clearInterval(intervalId);
	}, [mutation.mutate]);

	if (!isMounted) {
		return null;
	}

	let statusText = "Never";

	// biome-ignore lint/suspicious/noExplicitAny: treaty type issue
	const crawlDataAny = crawlData as any;
	if (crawlDataAny?.status === "failed") {
		statusText = "Failed";
	} else if (crawlDataAny?.status === "running") {
		statusText = "Running...";
	} else if (crawlLoading) {
		statusText = "Loading...";
	} else if (crawlDataAny?.completedAt) {
		statusText = `Last updated: ${formatDate(crawlDataAny.completedAt)} (${
			crawlDataAny.papersFound || 0
		} papers)`;
	}

	return (
		<div className="flex items-center gap-3 text-sm">
			<button
				className="m-0 hidden cursor-pointer border-none bg-transparent p-0 text-muted-foreground hover:text-red-500 md:inline-block"
				onDoubleClick={() => {
					setActiveJobId(null);
					toast.success("Queue status forcefully reset!");
				}}
				title="Double-click to force reset stuck queue"
				type="button"
			>
				{statusText}
			</button>
			<Button
				disabled={mutation.isPending || !!activeJobId}
				onClick={() => mutation.mutate()}
				size="sm"
				variant="secondary"
			>
				{mutation.isPending || !!activeJobId ? "Scraping..." : "Refresh Data"}
			</Button>
		</div>
	);
}

export default function Header() {
	return (
		<header className="border-b">
			<div className="container mx-auto flex items-center justify-between px-4 py-4">
				<div className="flex items-center gap-6">
					<Link className="font-semibold text-xl" to="/">
						Scholar Seek
					</Link>
					{/* <ScrapingSection /> */}
				</div>
				<div className="flex items-center gap-4">
					{/* <AuthSection /> */}
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
