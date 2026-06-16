const BASE_URL = "http://localhost:3000/api";

async function runTests() {
	console.log("🚀 Starting API Tests...\n");

	const username = `testuser_${Date.now()}`;
	const password = "password123";
	let jwtToken = "";

	// 1. Test Registration
	console.log("▶️  Testing Registration...");
	try {
		const res = await fetch(`${BASE_URL}/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
		const data = await res.json();
		console.log("Status:", res.status);
		console.log("Response:", data, "\n");
	} catch (e) {
		console.error("❌ Registration failed:", e, "\n");
	}

	// 2. Test Login
	console.log("▶️  Testing Login...");
	try {
		const res = await fetch(`${BASE_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		});
		const data = await res.json();
		console.log("Status:", res.status);
		console.log("Response:", data, "\n");
		if (data.token) {
			jwtToken = data.token;
			console.log("✅ JWT Token received\n");
		} else {
			console.log("❌ No JWT Token received\n");
			return; // Stop if we can't login
		}
	} catch (e) {
		console.error("❌ Login failed:", e, "\n");
		return;
	}

	// 3. Test Create Bookmark
	// We need a dummy paperId for this. Since we might not have one, it might fail foreign key constraints,
	// but let's try to bookmark a random UUID to see the API response.
	// If it fails with 500 because of Foreign Key, it's expected unless we fetch a paper first.
	// Let's try to fetch a paper to bookmark it properly.
	console.log("▶️  Fetching a paper to bookmark...");
	let paperId = "";
	try {
		// Assuming we have a /papers endpoint from the existing code
		const papersRes = await fetch(`${BASE_URL}/papers?limit=1`);
		if (papersRes.ok) {
			const papersData = await papersRes.json();
			if (papersData.data && papersData.data.length > 0) {
				paperId = papersData.data[0].id;
				console.log(`Found paper: ${paperId}\n`);
			} else {
				console.log(
					"No papers found to bookmark. We will use a random UUID (might cause FK error).\n"
				);
				paperId = crypto.randomUUID();
			}
		}
	} catch (e) {
		console.error("Failed to fetch paper:", e);
		paperId = crypto.randomUUID();
	}

	console.log("▶️  Testing Create Bookmark...");
	try {
		const res = await fetch(`${BASE_URL}/bookmarks`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${jwtToken}`,
			},
			body: JSON.stringify({ paperId }),
		});
		const data = await res.json();
		console.log("Status:", res.status);
		console.log("Response:", data, "\n");
	} catch (e) {
		console.error("❌ Create bookmark failed:", e, "\n");
	}

	// 4. Test Get Bookmarks
	console.log("▶️  Testing Get Bookmarks...");
	try {
		const res = await fetch(`${BASE_URL}/bookmarks`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${jwtToken}`,
			},
		});
		const data = await res.json();
		console.log("Status:", res.status);
		console.log("Response:", data, "\n");
	} catch (e) {
		console.error("❌ Get bookmarks failed:", e, "\n");
	}

	// 5. Test Last Updated Crawler
	console.log("▶️  Testing Last Updated Crawler...");
	try {
		const res = await fetch(`${BASE_URL}/crawl/last-updated`);
		const data = await res.json();
		console.log("Status:", res.status);
		console.log("Response:", data, "\n");
	} catch (e) {
		console.error("❌ Last updated failed:", e, "\n");
	}

	console.log("🏁 Tests finished!");
}

runTests();
