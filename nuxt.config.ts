import { defineNuxtConfig } from "nuxt/config";
import routesConfig from "./app/config/routes.ts";
import { appRedirects } from "./app/config/redirects.ts";
import { PRODUCTION_SITE_URL } from "./app/config/api.ts";
import { BROWSER_BUILD_TARGETS } from "./app/constants/browserSupport.ts";
import { visualizer } from "rollup-plugin-visualizer";

/** Канонический URL для SEO при сборке (NUXT_PUBLIC_SITE_URL — опционально, для staging). */
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? PRODUCTION_SITE_URL;

/** Fallback для <title> и og:title, если страница не задала свой title */
const defaultSiteTitle = "Nuxt Template";

/** Fallback для meta description и og:description */
const defaultSiteDescription = "Production-ready Nuxt starter template";

const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true" || process.env.VITEST === "1";
const isDev = process.env.NODE_ENV !== "production" && !isTest;
const isCssCodeSplitEnabled = process.env.NUXT_CSS_CODE_SPLIT === "1";

const devConnectSrc = isDev
	? [
			"ws://localhost:*", // Vite HMR (fallback-хост)
			"wss://localhost:*", // Vite HMR по HTTPS (fallback)
			"ws://127.0.0.1:*", // Vite HMR (IP fallback)
			"wss://127.0.0.1:*", // Vite HMR по HTTPS (IP fallback)
		]
	: [];

/**
 * CSP report-only: Защита приложения и отслеживание нарушений без блокировки.
 * Разрешает только необходимые ресурсы для шаблона (Яндекс.Метрика, Google Fonts, Vite HMR).
 */
const contentSecurityPolicyReportOnly = [
	"default-src 'self'", // Базовое правило: всё с origin сайта
	"base-uri 'self'", // Запрет подмены <base href>
	"object-src 'none'", // Flash/Java-плагины и embed через object
	"frame-ancestors 'self'", // Запрет встраивания сайта в чужие iframe (аналог X-Frame-Options)
	"form-action 'self'", // Отправка форм только на свой origin
	[
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'", // inline-скрипты Nuxt
		"https://mc.yandex.ru", // Яндекс.Метрика (tag.js)
		"https://yastatic.net", // Статика Яндекса
	].join(" "),
	"style-src 'self' 'unsafe-inline'", // inline-стили Vue/Nuxt
	"img-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:* https://mc.yandex.ru", // Картинки сайта, data-URI, blob-превью, любой HTTPS, Яндекс.Метрика, dev-хосты
	"font-src 'self' data: https://fonts.gstatic.com", // Локальные шрифты; data-URI; Google Fonts
	[
		"connect-src 'self'", // API Nitro (/api/*), same-origin fetch
		"https://mc.yandex.ru", // Яндекс.Метрика (webvisor, hit, collect)
		"wss://mc.yandex.ru", // Яндекс.Метрика (webvisor, solid.ws)
		...devConnectSrc, // Vite HMR WebSocket (только dev)
	].join(" "),
	"frame-src 'self'", // Свои iframe (если есть)
	"worker-src 'self' blob: data:", // Service worker приложения; blob/data для воркеров
	"report-uri /api/csp-report", // Эндпоинт сбора отчётов о нарушениях CSP
].join("; ");

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	// Включаем серверный рендеринг (SSR) по умолчанию
	ssr: true,
	// Версия совместимости: используемая версия Nuxt для миграции, deprecation warnings и типов Nitro
	compatibilityDate: "2026-09-16",
	// Vue DevTools для отладки в браузере (только в dev-режиме)
	devtools: { enabled: false },

	// Подключённые Nuxt-модули
	modules: [
		"@pinia/nuxt", // Стейт-менеджер Pinia с авто-импортом
		"@nuxt/icon", // Иконки через Iconify (<Icon name="mdi:…" />)
		"@nuxtjs/seo", // SEO: robots, og-image, schema-org, link-checker, site-config
		...(isTest ? (["@nuxt/test-utils/module"] as const) : []), // Vitest / e2e
	],

	// Директория со store-файлами Pinia (авто-импорт defineStore)
	pinia: { storesDirs: ["./app/stores"] },

	// Глобальный CSS (подключается на каждой странице; токены, типографика, rich-html)
	css: ["~/assets/styles/main.css"],

	// Не собирать Vue-файлы из app/pages/**/components/** в маршруты (только для повторного использования внутри страницы)
	ignore: ["app/pages/**/components/**"],

	// Настройки сборки Vite
	vite: {
		plugins: process.env.ANALYZE
			? [visualizer({ filename: "./.output/bundle-stats.html", gzipSize: true, brotliSize: true, open: false })]
			: [],
		build: {
			/**
			 * Поддерживаем браузеры с 2021 года: более старые получают серверную
			 * страницу /errors/old_browser.
			 */
			target: [...BROWSER_BUILD_TARGETS],
			// По умолчанию сохраняем проверенный единый CSS без FOUC. Флаг нужен для
			// воспроизводимого route-level эксперимента перед изменением production-стратегии.
			cssCodeSplit: isCssCodeSplitEnabled,
			// Порог предупреждения о размере чанка (КБ). Текущий максимум — ~305 КБ;
			// 400 даёт запас над ним, но ловит регрессии (раздувание чанка зависимостями).
			chunkSizeWarningLimit: 400,
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

	// Глобальная разметка <head> (страницы задают мета-теги через useSeoMeta / useHead)
	app: {
		head: {
			/**
			 * Глобальный title — используется как fallback, если страница не задала свой title.
			 */
			title: defaultSiteTitle,
			// Шаблон заголовка для страниц
			titleTemplate: "%s",
			htmlAttrs: { lang: "ru" },
			meta: [
				{ name: "apple-mobile-web-app-title", content: defaultSiteTitle },
				{ name: "theme-color", content: "#020420" },
				{ name: "msapplication-TileColor", content: "#020420" },
				{ property: "og:title", content: defaultSiteTitle },
				{ property: "og:description", content: defaultSiteDescription },
				{ property: "og:locale", content: "ru_RU" },
				{ property: "og:image", content: `${siteUrl}/favicon/icon-512x512.png` },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
			],
			link: [
				{ rel: "icon", type: "image/x-icon", href: "/favicon/favicon.ico?v=2" },
				{ rel: "icon", type: "image/svg+xml", href: "/favicon/favicon.svg?v=2" },
				{ rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon/icon-96x96.png?v=2" },
				{ rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/icon-32x32.png?v=2" },
				{ rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon/icon-16x16.png?v=2" },
				{ rel: "apple-touch-icon", sizes: "180x180", href: "/favicon/apple-touch-icon.png?v=2" },
				{ rel: "manifest", href: "/favicon/site.webmanifest" },
			],
		},
	},

	// Глобальные SEO-настройки сайта (модуль nuxt-site-config, часть @nuxtjs/seo)
	site: {
		url: siteUrl, // Канонический URL (canonical, og:url, robots)
		name: defaultSiteTitle, // Название сайта для мета-тегов и schema.org
		description: defaultSiteDescription, // Дефолтный description
		defaultLocale: "ru", // Локаль по умолчанию
		indexable: !isTest, // Разрешить индексацию — @nuxtjs/seo проставит robots: index,follow
		trailingSlash: true, // Завершающий слэш для SEO и Schema.org URL
	},

	// SEO-утилиты модуля @nuxtjs/seo (nuxt-seo-utils):
	// Отключаем автоматический инференс Twitter-тегов (так как twitter:card устарел и удалён по ТЗ)
	// и отключаем фикс абсолютных ссылок в dev-клиенте, вызывающий асинхронный tags:resolve во Unhead v3.
	seo: { enabled: !isTest, automaticOgAndTwitterTags: false, fixRequiredAbsoluteMetaTagsLinks: false },

	// Автогенерация OG-изображений для социальных сетей (nuxt-og-image)
	ogImage: {
		enabled: !isTest,
		// Генерация только при prerender — без runtime-эндпоинта в production
		zeroRuntime: true,
		includeTwitter: false,
	},

	// Sitemap генерирует backend (Go/nginx) и отдаётся по /sitemap.xml снаружи — фронт не трогает
	sitemap: { enabled: false },

	// Отключаем встроенный nuxt-skew-protection из @nuxtjs/seo, так как используется
	// собственный детерминированный механизм версионирования (frontendSha + backendSha)
	// и защита от сбоев загрузки чанков в error-handler.ts
	skewProtection: false,

	// robots.txt (@nuxtjs/robots)
	robots: {
		// Ссылка на sitemap, который отдаётся backend'ом
		sitemap: `${siteUrl}/sitemap.xml`,
		groups: [
			{
				userAgent: "*",
				// Публичная часть сайта открыта для индексации
				allow: ["/"],
				// Служебные разделы без SEO-ценности (корзина, расшаривание корзины, избранное, сравнение, checkout)
				disallow: ["/errors/"],
			},
		],
	},

	// JSON-LD структурированные данные Schema.org (nuxt-schema-org)
	schemaOrg: {
		identity: {
			type: "Organization", // Тип сущности — организация
			name: defaultSiteTitle,
			url: `${siteUrl}/`,
		},
	},

	// Проверка битых ссылок только в dev: в CI/Docker нет бэкенда, crawl даёт ложные 404/500
	linkChecker: { enabled: isDev },

	// Оптимизация для AI-поисковиков и языковых моделей (nuxt-ai-ready)
	aiReady: {
		enabled: !isTest,
		// Манифест /llms.txt для AI-ассистентов и краулеров (ChatGPT Search, Perplexity, Claude)
		// отдаётся как статика из public/llms.txt: при его наличии nuxt-ai-ready
		// не генерирует собственный манифест из конфига (см. docs модуля).
		// Content signals для AI-краулеров: разрешаем поиск и RAG-ответы, но запрещаем переобучение моделей
		contentSignal: { search: true, aiInput: true, aiTrain: false },
	},

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

	// SSG-маршруты заданы явно через routeRules (buildRouteRules); обход ссылок не нужен
	// и при crawlLinks: true NuxtLink prefetch на каждой странице раздувает число _payload.json.
	hooks: {
		"nitro:config"(nitroConfig) {
			nitroConfig.prerender = {
				...nitroConfig.prerender,
				crawlLinks: false,
				// Страницы с live API не должны валить `nuxt build` в CI/Docker без бэкенда.
				failOnError: false,
			};
			// Fallback для nuxt-ai-ready в @nuxtjs/seo v6 при отключённом модуле sitemap (sitemap.enabled: false)
			nitroConfig.virtual = nitroConfig.virtual || {};
			nitroConfig.virtual["#sitemap-virtual/static-config.mjs"] =
				nitroConfig.virtual["#sitemap-virtual/static-config.mjs"] || "export default {}";
		},
		"build:manifest"(manifest) {
			// Отключаем автоматическую генерацию сотен <link rel="prefetch"> для всех чанков проекта
			for (const key in manifest) {
				const chunk = manifest[key];
				if (chunk) {
					chunk.prefetch = false;
				}
			}
		},
	},

	// Настройки TypeScript
	typescript: {
		strict: true, // Строгий режим (рекомендуется для всего app/)
		typeCheck: false, // vue-tsc при сборке отключён — ускоряет build; проверка в IDE/CI отдельно
	},

	// Автоимпорт Vue-компонентов из app/components/ без префикса имени папки (UiButton, не UiUiButton)
	components: [{ path: "~/components", pathPrefix: false }],

	// Экспериментальные фичи Nuxt 4.6+: быстрая типизация $fetch на базе fetchdts
	experimental: {
		routeTypedFetch: true,
		serverPathFallback: false,
		checkOutdatedBuildInterval: false, // Отключаем встроенный опрос builds/latest.json
		defaults: { nuxtLink: { prefetch: false } },
	},

	// Runtime config
	runtimeConfig: {
		// --- Только сервер (не попадают в клиентский бандл) ---
		/** Опционально: переопределить auto-origin (dev → Nuxt template, prod → origin запроса). */
		apiBaseUrl: "", // NUXT_API_BASE_URL

		// --- Публичные (доступны на клиенте и сервере) ---
		public: {
			siteUrl, // NUXT_PUBLIC_SITE_URL
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

	rules["/**"] = {
		ssr: true,
		headers: {
			"content-security-policy-report-only": contentSecurityPolicyReportOnly,
			"permissions-policy": "camera=(), microphone=(), geolocation=(self)",
			"referrer-policy": "strict-origin-when-cross-origin",
			"x-content-type-options": "nosniff",
			"x-frame-options": "SAMEORIGIN",
		},
	};

	// Долгое кэширование статических шрифтов из public/fonts/
	rules["/fonts/**"] = { headers: { "cache-control": "public, max-age=31536000, immutable" } };
	// Долгое кэширование фавиконов и PWA-иконок из public/favicon/
	rules["/favicon/**"] = { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } };
	rules["/favicon/site.webmanifest"] = {
		headers: {
			"cache-control": "public, max-age=604800, stale-while-revalidate=86400",
			"content-type": "application/manifest+json; charset=utf-8",
		},
	};
	rules["/favicon/manifest.json"] = {
		headers: {
			"cache-control": "public, max-age=604800, stale-while-revalidate=86400",
			"content-type": "application/manifest+json; charset=utf-8",
		},
	};
	// Корневой /favicon.ico для совместимости со старыми браузерами и поисковыми роботами
	rules["/favicon.ico"] = { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } };

	for (const { from, to, statusCode } of appRedirects) {
		rules[from] = { redirect: statusCode ? { to, statusCode } : to };
	}

	for (const route of routesConfig) {
		const mode = (route.meta?.renderMode as string) ?? "ssr";
		const isNoIndex = Boolean(route.meta?.robots?.includes("noindex")) || mode === "spa";

		switch (mode) {
			case "ssg":
				rules[route.path] = { prerender: true, ...(isNoIndex ? { robots: false } : {}) };
				break;
			case "spa":
				rules[route.path] = { ssr: false, ...(isNoIndex ? { robots: false } : {}) };
				break;
			case "ssr":
			default:
				// SSR по умолчанию — отдельное правило не требуется
				if (isNoIndex) {
					rules[route.path] = { robots: false };
				}
				break;
		}
	}

	return rules;
}
