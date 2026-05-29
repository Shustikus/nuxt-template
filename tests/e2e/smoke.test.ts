import { createPage, setup } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

describe("e2e smoke", async () => {
	// Локально самый быстрый и стабильный вариант — тестироваться против уже запущенного dev-сервера.
	// При необходимости можно переопределить в CI: `NUXT_E2E_HOST=http://127.0.0.1:3000`.
	const targetHost = process.env.NUXT_E2E_HOST ?? "http://localhost:3000";
	await setup({ host: targetHost, browser: true, browserOptions: { type: "chromium", launch: { headless: true } } });

	it("opens home page", async () => {
		const page = await createPage("/");
		const title = await page.title();
		expect(title).toContain("Nuxt template");
	});
});
