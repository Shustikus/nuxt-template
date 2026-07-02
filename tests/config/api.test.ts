import { describe, expect, it } from "vitest";
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
	});

	it("buildBackendApiUrl combines origin and api path", () => {
		expect(buildBackendApiUrl("/example/v1/items/", { isDev: true })).toBe(
			`${LOCAL_BACKEND_ORIGIN}${API_BASE_PATH}/example/v1/items/`
		);
	});
});
