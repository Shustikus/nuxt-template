import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const rootDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(rootDir, "app");

const unitProject = {
	extends: true as const,
	plugins: [vue()],
	test: { name: "unit", environment: "jsdom" as const, globals: true, include: ["tests/**/*.test.ts"] },
};

const storybookProject = {
	extends: true as const,
	plugins: [storybookTest({ configDir: ".storybook" })],
	test: {
		name: "storybook",
		browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: "chromium" as const }] },
	},
};

// https://vitest.dev/config/
export default defineConfig({
	resolve: { alias: { "~": appDir, "@": appDir } },
	test: {
		environment: "jsdom",
		globals: true,
		projects: [unitProject, storybookProject],
		coverage: {
			provider: "v8",
			reportsDirectory: "./coverage",
			reporter: ["text", "html", "lcov"],
			exclude: [
				"node_modules/**",
				".nuxt/**",
				".output/**",
				"dist/**",
				"coverage/**",
				".storybook/**",
				"**/*.stories.{ts,js}",
				"**/*.mdx",
				"eslint.config.js",
				"vitest.config.ts",
				"nuxt.config.ts",
			],
		},
	},
});
