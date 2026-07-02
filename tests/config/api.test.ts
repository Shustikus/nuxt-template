import { afterEach, describe, expect, it, vi } from "vitest";
import {
	API_BASE_PATH,
	LOCAL_BACKEND_ORIGIN,
	PRODUCTION_SITE_URL,
	buildApiUrl,
	buildBackendApiUrl,
	resolveBackendOrigin,
} from "~/config/api";

describe("config/api", () => {
	it("buildApiUrl always prefixes /api", () => {
		expect(buildApiUrl("/example/v1/items/")).toBe("/api/example/v1/items/");
		expect(buildApiUrl("example/v1/items")).toBe("/api/example/v1/items");
	});

	it("resolveBackendOrigin uses localhost in dev", () => {
		expect(resolveBackendOrigin({ isDev: true })).toBe(LOCAL_BACKEND_ORIGIN);
	});

	it("resolveBackendOrigin uses request origin in production", () => {
		expect(resolveBackendOrigin({ isDev: false, requestOrigin: "https://staging.example.com" })).toBe(
			"https://staging.example.com"
		);
	});

	it("resolveBackendOrigin falls back to siteUrl without request", () => {
		expect(resolveBackendOrigin({ isDev: false, siteUrl: "https://example.com" })).toBe("https://example.com");
	});

	it("resolveBackendOrigin falls back to production site url", () => {
		expect(resolveBackendOrigin({ isDev: false })).toBe(PRODUCTION_SITE_URL);
	});

	it("resolveBackendOrigin respects override", () => {
		expect(resolveBackendOrigin({ isDev: true, apiBaseUrlOverride: "http://custom.backend" })).toBe(
			"http://custom.backend"
		);
		expect(resolveBackendOrigin({ isDev: true, apiBaseUrlOverride: "http://custom.backend/" })).toBe(
			"http://custom.backend"
		);
	});

	it("resolveBackendOrigin uses request origin from useRequestURL", () => {
		vi.stubGlobal("useRequestURL", () => ({ origin: "https://from-request.test" }));

		expect(resolveBackendOrigin({ isDev: false })).toBe("https://from-request.test");

		vi.unstubAllGlobals();
	});

	it("buildBackendApiUrl reads runtimeConfig when Nuxt context is available", () => {
		vi.stubGlobal("useRuntimeConfig", () => ({
			apiBaseUrl: "http://from-runtime-config",
			public: { siteUrl: "https://from-public" },
		}));

		expect(buildBackendApiUrl("/items", { isDev: false })).toBe("http://from-runtime-config/api/items");

		vi.unstubAllGlobals();
	});

	it("buildBackendApiUrl tolerates empty runtimeConfig fields", () => {
		vi.stubGlobal("useRuntimeConfig", () => ({ apiBaseUrl: undefined, public: {} }));

		expect(buildBackendApiUrl("/items", { isDev: true })).toBe(`${LOCAL_BACKEND_ORIGIN}/api/items`);

		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("buildBackendApiUrl combines origin and api path", () => {
		expect(buildBackendApiUrl("/example/v1/items/", { isDev: true })).toBe(
			`${LOCAL_BACKEND_ORIGIN}${API_BASE_PATH}/example/v1/items/`
		);
	});
});
