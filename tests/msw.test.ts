import { describe, expect, it } from "vitest";

describe("MSW", () => {
	it("перехватывает GET /api/health", async () => {
		const response = await fetch("/api/health");
		const data = (await response.json()) as { ok: boolean };

		expect(response.status).toBe(200);
		expect(data.ok).toBe(true);
	});
});
