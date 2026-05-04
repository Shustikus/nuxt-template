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
		const extraAlias = [
			{ find: "~", replacement: appDir },
			{ find: "@", replacement: appDir },
		];
		const existing = config.resolve?.alias;
		const alias = Array.isArray(existing)
			? [...existing, ...extraAlias]
			: { ...(existing as Record<string, string>), "~": appDir, "@": appDir };

		const include = new Set<string>([
			...(config.optimizeDeps?.include ?? []).flatMap((e) => (typeof e === "string" ? [e] : [])),
			"@storybook/addon-docs/blocks",
			"@storybook/addon-docs/preview",
			"storybook/internal/components",
			"@storybook/icons",
			"@nuxt/icon",
		]);

		return mergeConfig(config, {
			plugins: [vue()],
			resolve: { alias },
			// После «optimized dependencies changed. reloading» браузер иногда запрашивает
			// уже удалённый чанк в sb-vite/deps (syntaxhighlighter-*). Ранний include стабилизирует скан deps.
			optimizeDeps: { ...config.optimizeDeps, include: [...include] },
			build: { ...config.build, chunkSizeWarningLimit: 1600 },
		});
	},
};

export default config;
