import { describe, expect, it } from "vitest";
import routes from "~/config/routes";

describe("config/routes", () => {
	it("exports managed home route", () => {
		const home = routes.find((r) => r.name === "home");
		expect(home).toBeDefined();
		expect(home?.path).toBe("/");
		expect(home?.page).toBe("index");
	});

	it("exports old-browser route with noindex robots", () => {
		const oldBrowser = routes.find((r) => r.name === "old-browser");
		expect(oldBrowser).toBeDefined();
		expect(oldBrowser?.path).toBe("/errors/old_browser/");
		expect(oldBrowser?.meta?.robots).toBe("noindex,nofollow");
	});

	it("ensures all routes have unique names and paths", () => {
		const names = routes.map((r) => r.name);
		const paths = routes.map((r) => r.path);
		expect(new Set(names).size).toBe(names.length);
		expect(new Set(paths).size).toBe(paths.length);
	});
});
