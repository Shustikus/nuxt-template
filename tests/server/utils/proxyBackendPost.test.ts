import { beforeEach, describe, expect, it, vi } from "vitest";

describe("proxyBackendPost", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
	});

	it("forwards POST body to backend", async () => {
		const fetchFn = vi.fn().mockResolvedValue({ created: true });
		vi.stubGlobal("$fetch", fetchFn);

		const { proxyBackendPost } = await import("../../../server/utils/proxyBackendPost");
		const result = await proxyBackendPost<{ name: string }, { created: boolean }>({
			event: {} as never,
			path: "/api/test",
			body: { name: "test" },
		});

		expect(result).toEqual({ created: true });
		expect(fetchFn).toHaveBeenCalledWith(
			expect.stringContaining("/api/test"),
			expect.objectContaining({ method: "POST", body: { name: "test" } })
		);
	});

	it("returns backend error body without fallback", async () => {
		const body = { code: "validation_error" };
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue({ status: 422, data: body }));

		const { proxyBackendPost } = await import("../../../server/utils/proxyBackendPost");
		const result = await proxyBackendPost<Record<string, unknown>, { code: string }>({
			event: {} as never,
			path: "/api/test",
			body: { name: "test" },
		});

		expect(result).toEqual(body);
	});

	it("rethrows unknown errors", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));

		const { proxyBackendPost } = await import("../../../server/utils/proxyBackendPost");

		await expect(
			proxyBackendPost<string, string>({ event: {} as never, path: "/api/test", body: "payload" })
		).rejects.toThrow("network");
	});
});
