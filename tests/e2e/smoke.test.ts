import { describe, expect, it } from "vitest";

const host = process.env.NUXT_E2E_HOST ?? "http://localhost:3000";

describe("e2e smoke", () => {
	it("главная отдаёт 200", async () => {
		const response = await fetch(`${host}/`);
		expect(response.status).toBe(200);
	});
});
