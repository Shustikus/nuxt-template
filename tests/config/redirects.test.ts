import { afterEach, describe, expect, it } from "vitest";
import { buildStaticRedirectsMap, dynamicAppRedirects, resolveAppRedirect } from "~/config/redirects";

describe("app/config/redirects", () => {
	afterEach(() => {
		dynamicAppRedirects.length = 0;
	});

	describe("buildStaticRedirectsMap", () => {
		it("handles default statusCode and alternative slash deduplication", () => {
			const map = buildStaticRedirectsMap([
				{ from: "/slash-first/", to: "/target-1" },
				{ from: "/slash-first", to: "/target-1-override" },
				{ from: "/no-slash-first", to: "/target-2" },
				{ from: "/no-slash-first/", to: "/target-2-override" },
			]);

			expect(map.get("/slash-first/")?.statusCode).toBe(301);
			expect(map.get("/slash-first")?.to).toBe("/target-1-override");
			expect(map.get("/no-slash-first")?.to).toBe("/target-2");
			expect(map.get("/no-slash-first/")?.to).toBe("/target-2-override");
		});
	});

	describe("static redirects", () => {
		it("registers favicon aliases with 301", () => {
			expect(resolveAppRedirect("/site.webmanifest")).toEqual({ target: "/favicon/site.webmanifest", statusCode: 301 });
			expect(resolveAppRedirect("/site.webmanifest/")).toEqual({
				target: "/favicon/site.webmanifest",
				statusCode: 301,
			});
			expect(resolveAppRedirect("/manifest.json")).toEqual({ target: "/favicon/manifest.json", statusCode: 301 });
			expect(resolveAppRedirect("/apple-touch-icon.png")).toEqual({
				target: "/favicon/apple-touch-icon.png",
				statusCode: 301,
			});
			expect(resolveAppRedirect("/favicons/")).toEqual({ target: "/favicon/favicon.ico", statusCode: 301 });
			expect(resolveAppRedirect("/favicons")).toEqual({ target: "/favicon/favicon.ico", statusCode: 301 });
		});

		it("returns null for unmapped routes and empty pathname", () => {
			expect(resolveAppRedirect("")).toBeNull();
			expect(resolveAppRedirect("/some/unknown/route")).toBeNull();
			expect(resolveAppRedirect("/")).toBeNull();
		});
	});

	describe("dynamic redirects", () => {
		it("resolves dynamic pattern with custom status code", () => {
			dynamicAppRedirects.push({
				match: /^\/old-catalog\/(.*)/,
				resolve: (match) => `/catalog/${match[1]}`,
				statusCode: 302,
			});

			expect(resolveAppRedirect("/old-catalog/item-123")).toEqual({ target: "/catalog/item-123", statusCode: 302 });
		});

		it("uses 301 by default when statusCode is not provided", () => {
			dynamicAppRedirects.push({ match: /^\/legacy-path$/, resolve: () => "/new-path" });

			expect(resolveAppRedirect("/legacy-path")).toEqual({ target: "/new-path", statusCode: 301 });
		});

		it("returns null when resolve returns null or target matches current pathname", () => {
			dynamicAppRedirects.push({ match: /^\/ignore-path$/, resolve: () => null });
			dynamicAppRedirects.push({ match: /^\/same-path$/, resolve: (_m, p) => p });

			expect(resolveAppRedirect("/ignore-path")).toBeNull();
			expect(resolveAppRedirect("/same-path")).toBeNull();
		});
	});
});
