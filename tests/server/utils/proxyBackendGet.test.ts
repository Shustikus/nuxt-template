import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubCreateError } from "../h3TestStubs";

vi.mock("ofetch", () => ({ $fetch: vi.fn().mockResolvedValue({ via: "ofetch" }) }));

describe("proxyBackendGet", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
		stubCreateError();
	});

	it("returns backend response", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ ok: true }));

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");
		const result = await proxyBackendGet({ path: "/test", mock: { ok: false }, errorMessage: "fail" });

		expect(result).toEqual({ ok: true });
	});

	it("returns mock in Vitest when backend fails", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));

		const originalVitest = process.env.VITEST;
		process.env.VITEST = "true";

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");
		const result = await proxyBackendGet({ path: "/test", mock: { ok: false }, errorMessage: "fail" });

		expect(result).toEqual({ ok: false });

		process.env.VITEST = originalVitest;
	});

	it("throws createError outside Vitest when backend fails", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue(new Error("network")));

		const originalVitest = process.env.VITEST;
		delete process.env.VITEST;

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");

		await expect(
			proxyBackendGet({ path: "/test", mock: { ok: false }, errorMessage: "backend unavailable" })
		).rejects.toMatchObject({ statusCode: 502, message: "backend unavailable" });

		process.env.VITEST = originalVitest;
	});

	it("uses ofetch when global $fetch is unavailable", async () => {
		delete (globalThis as { $fetch?: unknown }).$fetch;

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");
		const result = await proxyBackendGet({ path: "/test", mock: { ok: false }, errorMessage: "fail" });

		expect(result).toEqual({ via: "ofetch" });
	});
});
