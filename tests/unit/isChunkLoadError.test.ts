import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "~/utils/isChunkLoadError";

describe("isChunkLoadError", () => {
	it("returns false for falsy and non-chunk values", () => {
		expect(isChunkLoadError(null)).toBe(false);
		expect(isChunkLoadError(undefined)).toBe(false);
		expect(isChunkLoadError("")).toBe(false);
		expect(isChunkLoadError(12345)).toBe(false);
		expect(isChunkLoadError(true)).toBe(false);
		expect(isChunkLoadError("just a normal string error")).toBe(false);
		expect(isChunkLoadError({ name: "RegularError" })).toBe(false);
	});

	it("returns true for ChunkLoadError name", () => {
		const error = new Error("Chunk load failed");
		error.name = "ChunkLoadError";
		expect(isChunkLoadError(error)).toBe(true);
	});

	it("detects Chrome/Edge dynamic import error", () => {
		const error = new TypeError(
			"Failed to fetch dynamically imported module: https://example.com/_nuxt/AboutPage.B7vK9L1x.js"
		);
		expect(isChunkLoadError(error)).toBe(true);
	});

	it("detects Firefox dynamic import error", () => {
		const error = new TypeError("error loading dynamically imported module: https://example.com/_nuxt/entry.D9kL2p.js");
		expect(isChunkLoadError(error)).toBe(true);
	});

	it("detects Safari/WebKit dynamic import error", () => {
		const error = new TypeError("Importing a module script failed.");
		expect(isChunkLoadError(error)).toBe(true);
	});

	it("detects Webpack/Vite chunk load failures", () => {
		expect(isChunkLoadError(new Error("Loading chunk 42 failed."))).toBe(true);
		expect(isChunkLoadError(new Error("Loading CSS chunk 15 failed."))).toBe(true);
	});

	it("detects Vite CSS preload errors", () => {
		expect(isChunkLoadError(new Error("Unable to preload CSS https://example.com/_nuxt/style.css"))).toBe(true);
	});

	it("detects string errors matching patterns", () => {
		expect(isChunkLoadError("Failed to fetch dynamically imported module: /_nuxt/test.js")).toBe(true);
		expect(isChunkLoadError("error loading dynamically imported module: /_nuxt/test.js")).toBe(true);
		expect(isChunkLoadError("importing a module script failed.")).toBe(true);
		expect(isChunkLoadError("loading chunk 1 failed")).toBe(true);
		expect(isChunkLoadError("loading css chunk 2 failed")).toBe(true);
		expect(isChunkLoadError("unable to preload css")).toBe(true);
	});

	it("detects nested errors via cause and data", () => {
		const cause = new TypeError("Failed to fetch dynamically imported module");
		const wrapper = new Error("Wrapper", { cause });
		expect(isChunkLoadError(wrapper)).toBe(true);

		const dataWrapper = { data: new Error("Loading chunk 1 failed.") };
		expect(isChunkLoadError(dataWrapper)).toBe(true);
	});
});
