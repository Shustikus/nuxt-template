import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubCreateError } from "../h3TestStubs";

describe("proxyBackendPost", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
		stubCreateError();
	});

	it("returns backend response", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ ok: true }));

		const { proxyBackendPost } = await import("../../../server/utils/proxyBackendPost");
		const result = await proxyBackendPost({
			path: "/test",
			body: { id: 1 },
			mock: { ok: false },
			errorMessage: "fail",
		});

		expect(result).toEqual({ ok: true });
	});

	it("returns static mock in Vitest when backend fails", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));

		const originalVitest = process.env.VITEST;
		process.env.VITEST = "true";

		const { proxyBackendPost } = await import("../../../server/utils/proxyBackendPost");
		const result = await proxyBackendPost({
			path: "/test",
			body: { id: 1 },
			mock: { ok: false },
			errorMessage: "fail",
		});

		expect(result).toEqual({ ok: false });

		process.env.VITEST = originalVitest;
	});

	it("returns mock function result in Vitest when backend fails", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));

		const originalVitest = process.env.VITEST;
		process.env.VITEST = "true";

		const { proxyBackendPost } = await import("../../../server/utils/proxyBackendPost");
		const result = await proxyBackendPost({
			path: "/test",
			body: { id: 42 },
			mock: (body) => ({ ok: true, id: body.id }),
			errorMessage: "fail",
		});

		expect(result).toEqual({ ok: true, id: 42 });

		process.env.VITEST = originalVitest;
	});
});
