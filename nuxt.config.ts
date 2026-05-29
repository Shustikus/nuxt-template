import { defineNuxtConfig } from "nuxt/config";
import routesConfig from "./app/config/routes";
import { visualizer } from "rollup-plugin-visualizer";

/**
 * Канонический URL сайта без завершающего слэша.
 *
 * Важно: `@nuxtjs/seo` (nuxt-site-config) валидирует url и ругается на localhost даже в dev.
 * Поэтому дефолт — «безопасный» домен, а для локальной разработки URL задаётся через env.
 */
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? "https://example.com";

/** Fallback для <title> и og:title, если страница не задала свой title */
const defaultSiteTitle = "Nuxt template";

/** Fallback для meta description и og:description */
const defaultSiteDescription = "Nuxt template";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true" || process.env.VITEST === "1";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	// Версия совместимости: используемая версия Nuxt для миграции, deprecation warnings и типов Nitro
	compatibilityDate: "2026-04-24",
	// Vue DevTools для отладки в браузере (только в dev-режиме)
	devtools: { enabled: import.meta.dev },

	// Подключённые Nuxt-модули
	modules: [
		"@pinia/nuxt", // Стейт-менеджер Pinia с авто-импортом
		"@nuxt/icon", // Иконки через Iconify (<Icon name="ci:…" />)
		"@nuxtjs/seo", // SEO: robots, og-image, schema-org, link-checker, site-config
		"@nuxt/test-utils/module", // Хелперы для Vitest (@nuxt/test-utils)
	],

	// Директория со store-файлами Pinia (авто-импорт defineStore)
	pinia: { storesDirs: ["./app/stores"] },

	// Глобальный CSS (подключается на каждой странице)
	css: ["~/assets/styles/main.css"],

	// Не собирать Vue-файлы из app/pages/**/components/** в маршруты (только для повторного использования внутри страницы)
	ignore: ["app/pages/**/components/**"],

	// Настройки сборки Vite
	vite: {
		plugins: process.env.ANALYZE
			? [visualizer({ filename: "./.output/bundle-stats.html", gzipSize: true, brotliSize: true, open: false })]
			: [],
		build: {
			// Один CSS-бандл вместо чанков по асинхронным компонентам/страницам — иначе стили
			// из родительских SFC (где задают классы дочерним компонентам) могут подключаться
			// чуть позже первого paint и давать заметный «перещёлк» (FOUC).
			cssCodeSplit: false,
			// Порог предупреждения о размере чанка (КБ); каталог тянет крупные зависимости
			chunkSizeWarningLimit: 1500,
			// Без polyfill: вставка vite/modulepreload-polyfill ломает sourcemap (WARN от Vite при билде)
			modulePreload: { polyfill: false },
		},
	},

	// Флаги поведения Nuxt
	features: {
		// Иначе в production одни и те же стили: в <style> в HTML (SSR inline) и снова в /_nuxt/style.*.css
		inlineStyles: false,
	},

	// Гибридный рендеринг — правила генерируются из app/config/routes.ts (см. buildRouteRules)
	routeRules: buildRouteRules(),

	// Глобальная разметка <head> (fallback; страницы переопределяют через useSeoMeta / definePageMeta)
	app: {
		head: {
			/**
			 * Глобальный title — используется как fallback, если страница не задала свой title.
			 * Страницы, задавшие title через useSeoMeta, получают шаблон ниже.
			 */
			title: defaultSiteTitle,
			// Шаблон заголовка для страниц: «Каталог» → «Каталог — Олдис»
			titleTemplate: "%s — Nuxt template",
			htmlAttrs: { lang: "ru" },
			charset: "utf-8",
			meta: [
				{ name: "description", content: defaultSiteDescription },
				{ name: "apple-mobile-web-app-title", content: "Nuxt template" },
				/**
				 * Open Graph — превью при шаринге (VK, Telegram, и т.д.)
				 * Переопределяются на страницах через useSeoMeta({ ogTitle, ogDescription, ... })
				 */
				{ property: "og:title", content: defaultSiteTitle },
				{ property: "og:description", content: defaultSiteDescription },
				{ property: "og:url", content: siteUrl },
				{ property: "og:type", content: "website" },
				{ property: "og:site_name", content: "Nuxt template" },
				{ property: "og:locale", content: "ru_RU" },
			],
			link: [
				// Единственный favicon в public/; при появлении набора иконок — дополнить link[]
				{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
			],
		},
	},

	// Глобальные SEO-настройки сайта (модуль nuxt-site-config, часть @nuxtjs/seo)
	site: {
		url: siteUrl, // Канонический URL (canonical, og:url, robots)
		name: "", // Название сайта для мета-тегов и schema.org
		description: defaultSiteDescription, // Дефолтный description
		defaultLocale: "ru", // Локаль по умолчанию
		indexable: true, // Разрешить индексацию — @nuxtjs/seo проставит robots: index,follow
	},

	// Автогенерация OG-изображений для социальных сетей (nuxt-og-image)
	ogImage: {
		enabled: !isTest,
		// Генерация только при prerender — без runtime-эндпоинта в production
		zeroRuntime: true,
	},

	// Sitemap генерирует backend (Go/nginx) и отдаётся по /sitemap.xml снаружи — фронт не трогает
	sitemap: { enabled: false },

	// robots.txt (@nuxtjs/robots)
	robots: {
		// Ссылка на sitemap, который отдаётся backend'ом
		sitemap: `${siteUrl}/sitemap.xml`,
		groups: [
			{
				userAgent: "*",
				// Публичная часть сайта открыта для индексации
				allow: ["/"],
				// Служебные разделы без SEO-ценности (корзина, избранное, сравнение)
				disallow: ["/basket", "/favourites", "/compare"],
			},
		],
	},

	// JSON-LD структурированные данные Schema.org (nuxt-schema-org)
	schemaOrg: {
		identity: {
			type: "Organization", // Тип сущности — организация
			name: "Nuxt template",
			url: siteUrl,
		},
	},

	// Проверка битых ссылок при dev-сборке (nuxt-link-checker)
	linkChecker: { enabled: import.meta.dev },

	// Настройки @nuxt/icon: без внешнего провайдера, SVG, сканирование используемых иконок в бандл
	icon: {
		provider: "none", // Не тянуть иконки с CDN Iconify в runtime
		mode: "svg",
		size: "1em",
		class: "icon", // CSS-класс на <span> обёртке
		clientBundle: {
			scan: true, // Собрать в клиентский бандл только реально используемые иконки
			sizeLimitKb: 256, // Лимит размера client bundle иконок
		},
	},

	// Сервер Nitro
	nitro: {
		compressPublicAssets: true, // Сжатие статики из public/ (gzip/brotli) в production
		minify: true, // Минификация серверного бандла — уменьшает .output/server
	},

	// Настройки TypeScript
	typescript: {
		strict: true, // Строгий режим (рекомендуется для всего app/)
		typeCheck: false, // vue-tsc при сборке отключён — ускоряет build; проверка в IDE/CI отдельно
	},

	// Автоимпорт Vue-компонентов из app/components/ без префикса имени папки (UiButton, не UiUiButton)
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
			siteUrl,
			/** NUXT_PUBLIC_API_BASE */
			apiBase: "/api",
		},
	},
});

/**
 * Генерирует routeRules для Nitro на основе managed-маршрутов из app/config/routes.ts.
 *
 * По умолчанию все маршруты рендерятся через SSR.
 * Для изменения стратегии задайте `meta.renderMode` в routes.ts:
 *   - `'ssr'` — server-side rendering (по умолчанию)
 *   - `'ssg'` — static site generation (prerender при сборке)
 *   - `'spa'` — client-only SPA (без серверного рендеринга)
 */
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
