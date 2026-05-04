import { describe, expect, it } from "vitest";
import routes from "../app/config/routes";

describe("шаблон", () => {
	it("vitest запускается", () => {
		expect(1 + 1).toBe(2);
	});

	it("есть управляемые маршруты", () => {
		expect(routes.length).toBeGreaterThanOrEqual(1);
		expect(routes[0]?.path).toBe("/");
	});
});
