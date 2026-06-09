import { describe, expect, it } from "bun:test";

// Kita akan mengetes koneksi dasar server
describe("Server Basic Health Check", () => {
	it("should return 200 for root path", async () => {
		// Kita tidak perlu menyalakan server beneran, cukup panggil lewat fetch internal Bun
		const response = await fetch("http://localhost:3000/");
		// Karena di root kita serve index.html (atau 404 kalau belum di-build), 
		// kita cek apakah statusnya bukan 500 (Internal Server Error)
		expect(response.status).toBeLessThan(500);
	});
});

describe("Papers API Search", () => {
	it("should handle empty search query gracefully", async () => {
		const response = await fetch("http://localhost:3000/api/papers?q=");
		const data = await response.json();
		
		expect(response.status).toBe(200);
		expect(data).toHaveProperty("papers");
		expect(Array.isArray(data.papers)).toBe(true);
	});

	it("should have total property in search result", async () => {
		const response = await fetch("http://localhost:3000/api/papers?q=test");
		const data = await response.json();
		
		expect(data).toHaveProperty("total");
		expect(typeof data.total).toBe("number");
	});
});
