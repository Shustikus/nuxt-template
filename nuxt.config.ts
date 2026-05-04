import { defineNuxtConfig } from "nuxt/config";
import routesConfig from "./app/config/routes";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2026-04-24",
	vite: { build: { cssCodeSplit: false, modulePreload: { polyfill: false } } },
	features: { inlineStyles: false },
	devtools: { enabled: true },
	modules: ["@nuxt/icon", "@nuxt/test-utils/module"],
	routeRules: buildRouteRules(),
	icon: { provider: "none", mode: "svg", size: "1em", class: "icon", clientBundle: { scan: true, sizeLimitKb: 256 } },
	typescript: { strict: true, typeCheck: false },
	components: [{ path: "~/components", pathPrefix: false }],
	/**
	 * Значения по умолчанию; переопределение через .env — см. .env.example и README.
	 * Серверные ключи: NUXT_* (без PUBLIC). Публичные: NUXT_PUBLIC_*.
	 */
	runtimeConfig: {
		/** приватный пример: NUXT_API_SECRET */
		apiSecret: "",
		public: {
			/** NUXT_PUBLIC_SITE_URL */
			siteUrl: "",
			/** NUXT_PUBLIC_API_BASE */
			apiBase: "/api",
		},
	},
});

function buildRouteRules() {
	const rules: Record<string, object> = {};
	for (const route of routesConfig) {
		const mode = (route.meta?.renderMode as string) ?? "ssr";
		switch (mode) {
			case "ssg":
				rules[route.path] = { prerender: true };
				break;
			case "spa":
				rules[route.path] = { ssr: false };
				break;
			default:
				break;
		}
	}
	return rules;
}
