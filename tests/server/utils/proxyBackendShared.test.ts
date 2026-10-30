import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	assertBackendResponseData,
	forwardBackendError,
	getBackendRetryOptions,
	getServerFetch,
	isProxyTestEnv,
	toProxyRequestBody,
} from "../../../server/utils/proxyBackendShared";

describe("proxyBackendShared", () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
	});

	describe("isProxyTestEnv", () => {
		it("detects Vitest environment", () => {
			expect(isProxyTestEnv()).toBe(true);
		});

		it("returns false when no vitest globals or env are set", () => {
			const originalVitestGlobal = (globalThis as { __VITEST__?: boolean }).__VITEST__;
			const originalEnv = process.env.VITEST;
			try {
				delete (globalThis as { __VITEST__?: boolean }).__VITEST__;
				delete process.env.VITEST;
				expect(isProxyTestEnv()).toBe(false);
			} finally {
				(globalThis as { __VITEST__?: boolean }).__VITEST__ = originalVitestGlobal;
				process.env.VITEST = originalEnv;
			}
		});
	});

	describe("getServerFetch", () => {
		it("returns global $fetch when available", () => {
			const mockFetch = vi.fn();
			vi.stubGlobal("$fetch", mockFetch);
			expect(getServerFetch()).toBe(mockFetch);
		});

		it("falls back to ofetch when global $fetch is undefined", () => {
			delete (globalThis as { $fetch?: unknown }).$fetch;
			const fetcher = getServerFetch();
			expect(typeof fetcher).toBe("function");
		});
	});

	describe("getBackendRetryOptions", () => {
		it("returns undefined in test environment", () => {
			expect(getBackendRetryOptions(true)).toBeUndefined();
			expect(getBackendRetryOptions(false)).toBeUndefined();
		});

		it("returns retry config for safe methods outside test env", () => {
			const originalVitestGlobal = (globalThis as { __VITEST__?: boolean }).__VITEST__;
			const originalEnv = process.env.VITEST;
			try {
				delete (globalThis as { __VITEST__?: boolean }).__VITEST__;
				delete process.env.VITEST;
				expect(getBackendRetryOptions(false)).toBeUndefined();
				expect(getBackendRetryOptions(true)).toEqual({ retry: 3, retryDelay: 500, retryStatusCodes: [502, 503, 504] });
			} finally {
				(globalThis as { __VITEST__?: boolean }).__VITEST__ = originalVitestGlobal;
				process.env.VITEST = originalEnv;
			}
		});
	});

	describe("toProxyRequestBody", () => {
		it("returns the passed body unchanged", () => {
			const body = { test: 123 };
			expect(toProxyRequestBody(body)).toBe(body);
		});
	});

	describe("assertBackendResponseData", () => {
		it("returns data when defined", () => {
			expect(assertBackendResponseData({ ok: true })).toEqual({ ok: true });
			expect(assertBackendResponseData(0)).toBe(0);
			expect(assertBackendResponseData(false)).toBe(false);
		});

		it("throws when data is undefined", () => {
			expect(() => assertBackendResponseData(undefined)).toThrow("Backend returned an empty response body");
		});
	});

	describe("forwardBackendError", () => {
		it("forwards error response data and sets status on event.node", () => {
			const headers = new Headers({ "content-type": "application/json" });
			const error = { response: { status: 400, _data: { error: "bad_request" }, headers } };
			const setHeaderMock = vi.fn();
			const event = { node: { res: { statusCode: 200, setHeader: setHeaderMock } } };

			const result = forwardBackendError(event as never, error);
			expect(result).toEqual({ error: "bad_request" });
			expect(setHeaderMock).toHaveBeenCalledWith("content-type", "application/json");
		});

		it("forwards error response data without content-type header when not present", () => {
			const error = { response: { status: 400, _data: { error: "no_content_type" }, headers: new Headers() } };
			const setHeaderMock = vi.fn();
			const event = { node: { res: { statusCode: 200, setHeader: setHeaderMock } } };

			const result = forwardBackendError(event as never, error);
			expect(result).toEqual({ error: "no_content_type" });
			expect(setHeaderMock).not.toHaveBeenCalled();
		});

		it("forwards error with top-level status and data without node res", () => {
			const error = { status: 404, data: { message: "not found" } };
			const event = {};

			const result = forwardBackendError(event as never, error);
			expect(result).toEqual({ message: "not found" });
		});

		it("forwards error with statusCode fallback", () => {
			const error = { statusCode: 403, data: "forbidden" };
			const event = {};

			const result = forwardBackendError(event as never, error);
			expect(result).toBe("forbidden");
		});

		it("re-throws error when no response status or data present", () => {
			expect(() => forwardBackendError({} as never, new Error("Generic failure"))).toThrow("Generic failure");
			expect(() => forwardBackendError({} as never, null)).toThrow();
			expect(() => forwardBackendError({} as never, "string error")).toThrow("string error");
		});
	});
});
