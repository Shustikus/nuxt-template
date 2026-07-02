import type { StorybookConfig } from "@storybook/vue3-vite";
import vue from "@vitejs/plugin-vue";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const storybookDir = dirname(fileURLToPath(import.meta.url));

/**
 * Конфигурация Storybook.
 * @see https://storybook.js.org/docs/configure
 */
const config: StorybookConfig = {
	core: { disableTelemetry: true },

	stories: ["../app/**/*.mdx", "../app/**/*.stories.@(js|ts)"],

	addons: ["@storybook/addon-docs", "@storybook/addon-links", "@storybook/addon-a11y", "@storybook/addon-vitest"],

	framework: {
		name: "@storybook/vue3-vite",
		// vue-component-meta тянет volar/vue-router из .nuxt и падает вне Nuxt; для Storybook достаточно vue-docgen-api
		options: { docgen: "vue-docgen-api" },
	},

	docs: { defaultName: "Документация" },

	viteFinal: (config) => {
		const appDir = resolve(storybookDir, "../app");
		const nuxtAppShim = resolve(storybookDir, "shims/nuxt-app.ts");
		const extraAlias = [
			{ find: "#app", replacement: nuxtAppShim },
			{ find: "~", replacement: appDir },
			{ find: "@", replacement: appDir },
		];
		const existing = config.resolve?.alias;
		const alias = Array.isArray(existing)
			? [...existing, ...extraAlias]
			: { ...(existing as Record<string, string>), "#app": nuxtAppShim, "~": appDir, "@": appDir };

		const include = new Set<string>([
			...(config.optimizeDeps?.include ?? []).flatMap((e) => (typeof e === "string" ? [e] : [])),
			"@storybook/addon-docs/blocks",
			"@storybook/addon-docs/preview",
			"storybook/internal/components",
			"@storybook/icons",
			"@nuxt/icon",
		]);

		return mergeConfig(config, {
			build: { cssMinify: "esbuild" },
			plugins: [vue()],
			resolve: { alias },
			define: { __STORYBOOK_A11Y_TEST_MODE__: JSON.stringify(process.env.STORYBOOK_A11Y_TEST_MODE ?? "todo") },
			// После «optimized dependencies changed. reloading» браузер иногда запрашивает
			// уже удалённый чанк в sb-vite/deps (syntaxhighlighter-*). Ранний include стабилизирует скан deps.
			optimizeDeps: { ...config.optimizeDeps, include: [...include] },
		});
	},
};

export default config;
