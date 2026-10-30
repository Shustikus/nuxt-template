import { describe, expect, it } from "vitest";

describe("stripPrefetchLinks plugin", () => {
	it("removes rel='prefetch' links from htmlContext.head array", async () => {
		let capturedHook: ((context: { head: unknown[] }) => void) | undefined;
		const nitroApp = {
			hooks: {
				hook: (name: string, handler: (context: { head: unknown[] }) => void) => {
					if (name === "render:html") capturedHook = handler;
				},
			},
		};

		const pluginModule = await import("../../../server/plugins/stripPrefetchLinks");
		pluginModule.default(nitroApp as never);

		expect(capturedHook).toBeDefined();

		const context = {
			head: [
				'<link rel="stylesheet" href="/style.css">',
				'<link rel="prefetch" href="/_nuxt/chunk1.js">',
				'<link as="script" rel="prefetch" href="/_nuxt/chunk2.js">',
				{ notAString: true },
			],
		};

		capturedHook!(context);

		expect(context.head[0]).toBe('<link rel="stylesheet" href="/style.css">');
		expect(context.head[1]).toBe("");
		expect(context.head[2]).toBe("");
		expect(context.head[3]).toEqual({ notAString: true });
	});

	it("safely handles head when it is not an array", async () => {
		let capturedHook: ((context: { head: unknown }) => void) | undefined;
		const nitroApp = {
			hooks: {
				hook: (name: string, handler: (context: { head: unknown }) => void) => {
					if (name === "render:html") capturedHook = handler;
				},
			},
		};

		const pluginModule = await import("../../../server/plugins/stripPrefetchLinks");
		pluginModule.default(nitroApp as never);

		const context = { head: null };
		expect(() => capturedHook!(context)).not.toThrow();
	});
});
