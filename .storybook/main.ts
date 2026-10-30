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
	features: { experimentalDocgenServer: true },

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
		const nuxtComponentsShim = resolve(storybookDir, "shims/storybookComponentsShim.ts");
		const extraAlias = [
			{ find: "#app", replacement: nuxtAppShim },
			{ find: "#components", replacement: nuxtComponentsShim },
			{ find: "~", replacement: appDir },
			{ find: "@", replacement: appDir },
		];
		const existing = config.resolve?.alias;
		const alias = Array.isArray(existing)
			? [...existing, ...extraAlias]
			: {
					...(existing as Record<string, string>),
					"#app": nuxtAppShim,
					"#components": nuxtComponentsShim,
					"~": appDir,
					"@": appDir,
				};

		const include = new Set<string>([
			...(config.optimizeDeps?.include ?? []).flatMap((e) => (typeof e === "string" ? [e] : [])),
			"@storybook/addon-docs/blocks",
			"@storybook/addon-docs/preview",
			"storybook/internal/components",
			"@storybook/icons",
			// CJS из @testing-library / a11y: без prebundle Vite 8 browser ломает named/default exports
			"aria-query",
			"dom-accessibility-api",
			"lz-string",
			"pretty-format",
			"react-is",
			"@testing-library/dom",
			"@testing-library/jest-dom",
			"@testing-library/dom > lz-string",
			"@testing-library/dom > pretty-format",
			"@testing-library/dom > aria-query",
			"pretty-format > react-is",
		]);

		return mergeConfig(config, {
			// Vite 8 минифицирует CSS через lightningcss и падает на @position-try (intl-tel-input)
			// и calc() в media queries из docs-токенов.
			build: { cssMinify: "esbuild" },
			plugins: [vue()],
			resolve: { alias },
			define: { __STORYBOOK_A11Y_TEST_MODE__: JSON.stringify(process.env.STORYBOOK_A11Y_TEST_MODE ?? "todo") },
			// После «optimized dependencies changed. reloading» браузер иногда запрашивает
			// уже удалённый чанк в sb-vite/deps (syntaxhighlighter-*). Ранний include стабилизирует скан deps.
			optimizeDeps: {
				...config.optimizeDeps,
				include: [...include],
				needsInterop: [
					...new Set([
						...(config.optimizeDeps?.needsInterop ?? []),
						"aria-query",
						"lz-string",
						"pretty-format",
						"react-is",
					]),
				],
			},
		});
	},
};

export default config;
