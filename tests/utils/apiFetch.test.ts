import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ofetch", () => ({ $fetch: vi.fn().mockResolvedValue({ via: "ofetch" }) }));

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

	it("keeps path when it already starts with /api", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal("$fetch", fetchMock);

		const { apiGet } = await import("~/utils/apiFetch");
		await apiGet("/api/already");

		expect(fetchMock).toHaveBeenCalledWith("/api/already", expect.objectContaining({ method: "GET" }));
	});

	it("apiPost sends POST body", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ created: true });
		vi.stubGlobal("$fetch", fetchMock);

		const { apiPost } = await import("~/utils/apiFetch");
		const result = await apiPost("/items", { id: 1 });

		expect(result).toEqual({ created: true });
		expect(fetchMock).toHaveBeenCalledWith("/api/items", expect.objectContaining({ method: "POST", body: { id: 1 } }));
	});

	it("defaultApiFetch uses shared client", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal("$fetch", fetchMock);

		const { defaultApiFetch } = await import("~/utils/apiFetch");
		await defaultApiFetch("/shared");

		expect(fetchMock).toHaveBeenCalledWith("/api/shared", expect.objectContaining({ method: "GET" }));
	});

	it("createApiFetch uses injected fetch", async () => {
		const customFetch = vi.fn().mockResolvedValue({ ok: true });
		const { createApiFetch } = await import("~/utils/apiFetch");
		const api = createApiFetch(customFetch);

		await api("/injected", { method: "POST", body: { q: 1 } });

		expect(customFetch).toHaveBeenCalledWith(
			"/api/injected",
			expect.objectContaining({ method: "POST", body: { q: 1 } })
		);
	});

	it("reuses default client between calls", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal("$fetch", fetchMock);

		const { apiGet } = await import("~/utils/apiFetch");
		await apiGet("/first");
		await apiGet("/second");

		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("uses ofetch when global $fetch is unavailable", async () => {
		delete (globalThis as { $fetch?: unknown }).$fetch;

		const { apiGet } = await import("~/utils/apiFetch");
		const result = await apiGet("/ofetch");

		expect(result).toEqual({ via: "ofetch" });
	});
});
