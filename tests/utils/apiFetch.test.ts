import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiFetch", () => {
	let originalVitest: string | undefined;

	beforeEach(() => {
		originalVitest = process.env.VITEST;
		vi.resetModules();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		if (originalVitest === undefined) {
			delete process.env.VITEST;
		} else {
			process.env.VITEST = originalVitest;
		}
	});

	describe("apiGetWithFallback", () => {
		it("returns fallback only in Vitest when request fails", async () => {
			vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));
			process.env.VITEST = "true";

			const { apiGetWithFallback } = await import("~/utils/apiFetch");
			const result = await apiGetWithFallback("/missing", { ok: true });
			expect(result).toEqual({ ok: true });
		});

		it("rethrows outside Vitest when request fails", async () => {
			vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));
			delete process.env.VITEST;

			const { apiGetWithFallback } = await import("~/utils/apiFetch");

			await expect(apiGetWithFallback("/missing", { ok: true })).rejects.toThrow("network");
		});
	});

	it("apiGet prefixes /api for Nitro routes", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal("$fetch", fetchMock);
		process.env.VITEST = "true";

		const { apiGet } = await import("~/utils/apiFetch");
		await apiGet("/example");

		expect(fetchMock).toHaveBeenCalledWith("/api/example", expect.objectContaining({ method: "GET" }));
	});
});
