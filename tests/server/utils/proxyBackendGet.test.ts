import { beforeEach, describe, expect, it, vi } from "vitest";
import * as shared from "../../../server/utils/proxyBackendShared";

vi.mock("../../../server/utils/proxyBackendShared", async (importOriginal) => {
	const mod = await importOriginal<typeof import("../../../server/utils/proxyBackendShared")>();
	return { ...mod, getBackendRetryOptions: vi.fn() };
});

describe("proxyBackendGet", () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
		vi.mocked(shared.getBackendRetryOptions).mockReturnValue(undefined);
	});

	it("returns backend response", async () => {
		vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ ok: true }));

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");
		const result = await proxyBackendGet({ event: {} as never, path: "/test" });

		expect(result).toEqual({ ok: true });
	});

	it("passes retry options when available", async () => {
		const fetchMock = vi.fn().mockResolvedValue({ retried: true });
		vi.stubGlobal("$fetch", fetchMock);
		vi.mocked(shared.getBackendRetryOptions).mockReturnValue({ retry: 2 });

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");
		const result = await proxyBackendGet({ event: {} as never, path: "/retry-test" });

		expect(result).toEqual({ retried: true });
		expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { retry: 2 });
	});

	it("returns backend error body without fallback", async () => {
		const body = { code: "backend_error" };
		vi.stubGlobal("$fetch", vi.fn().mockRejectedValue({ status: 503, data: body }));

		const { proxyBackendGet } = await import("../../../server/utils/proxyBackendGet");
		const result = await proxyBackendGet({ event: {} as never, path: "/test" });

		expect(result).toEqual(body);
	});
});
