import { createPage, setup } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";

describe("e2e smoke", async () => {
	// Локально — против уже запущенного dev: `NUXT_E2E_HOST=http://localhost:3000 npm run test:e2e`.
	// В CI сервер поднимает @nuxt/test-utils (build + preview).
	const externalHost = process.env.NUXT_E2E_HOST;

	await setup({
		...(externalHost ? { host: externalHost } : { serverStartTimeout: 180_000 }),
		browser: true,
		browserOptions: { type: "chromium", launch: { headless: true } },
	});

	it("opens home page", async () => {
		const page = await createPage("/");
		const title = await page.title();
		expect(title).toContain("Nuxt template");
	});
});
