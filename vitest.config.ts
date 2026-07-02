import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineVitestProject } from "@nuxt/test-utils/config";
import { nuxtImportMetaShim } from "./tests/nuxtImportMetaShim";

// https://vitest.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"~": resolve(__dirname, "app"),
			"@": resolve(__dirname, "app"),
			"~~": resolve(__dirname),
			"@@": resolve(__dirname),
		},
	},

	test: {
		// describe/it/expect доступны глобально без импорта (по всем проектам)
		globals: true,

		// Coverage нацеливаем только на доменную логику и server handlers.
		// UI/markup тесты считаем опциональными, без жёсткого давления по порогам.
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			// «Мягкий» гейт: считаем покрытие по наиболее важной логике (utils) и server/api handlers,
			// а не по всему Nuxt runtime-коду (composables/services/UI), который часто тестируется иначе.
			include: [
				"app/config/**/*.{ts,tsx}",
				"app/utils/**/*.{ts,tsx}",
				"app/features/**/utils/**/*.{ts,tsx}",
				"app/features/**/config/**/*.{ts,tsx}",
				"app/shared/**/utils/**/*.{ts,tsx}",
				"server/api/**/*.{ts,tsx}",
				"server/utils/**/*.{ts,tsx}",
			],
			exclude: [
				"**/*.d.ts",
				"**/.nuxt/**",
				"**/.output/**",
				"**/dist/**",
				"**/node_modules/**",
				"**/mocks/**",
				"**/*.stories.*",
				"**/*storybook*",
			],
			thresholds: {
				// Мягкий гейт: держим высоко, но не требуем 100%.
				lines: 80,
				functions: 80,
				statements: 80,
				branches: 70,
			},
		},

		projects: [
			{
				extends: true,
				plugins: [nuxtImportMetaShim(), vue()],
				test: {
					name: "unit",
					sequence: { groupOrder: 0 },
					environment: "jsdom",
					include: ["tests/**/*.{test,spec}.ts"],
					exclude: ["tests/server/**", "tests/e2e/**", "tests/nuxt/**"],
					// MSW-сервер запускается только для unit-тестов
					setupFiles: "./tests/setup.ts",
					maxWorkers: 2,
					execArgv: ["--max-old-space-size=2048"],
				},
			},
			{
				extends: true,
				test: {
					name: "server",
					sequence: { groupOrder: 1 },
					environment: "node",
					include: ["tests/server/**/*.{test,spec}.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "e2e",
					environment: "node",
					include: ["tests/e2e/**/*.{test,spec}.ts"],
					// E2E тесты могут быть медленнее локально.
					testTimeout: 60_000,
					hookTimeout: 180_000,
				},
			},
			await defineVitestProject({
				test: {
					name: "nuxt",
					environment: "nuxt",
					environmentOptions: { nuxt: { domEnvironment: "jsdom" } },
					include: ["tests/nuxt/**/*.{test,spec}.ts"],
				},
			}),
			{
				extends: true,
				plugins: [
					storybookTest({
						// Для browser mode стабильнее относительный путь к Storybook config.
						configDir: ".storybook",
					}),
				],
				test: {
					name: "storybook",
					browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: "chromium" }] },
				},
			},
		],
	},
});
