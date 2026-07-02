import { describe, expect, it } from "vitest";
import routes from "~/config/routes";

describe("config/routes", () => {
	it("exports managed home route", () => {
		expect(routes).toEqual([{ name: "home", path: "/", page: "index", meta: { title: "Главная" } }]);
	});
});
