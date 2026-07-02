import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubCreateError } from "../h3TestStubs";

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
});
