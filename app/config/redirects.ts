export type RedirectStatusCode = 301 | 302 | 307 | 308;

export interface RedirectTarget {
	target: string;
	statusCode: RedirectStatusCode;
}

export interface StaticRedirectRule {
	from: string;
	to: string;
	statusCode?: RedirectStatusCode;
}

export interface DynamicRedirectRule {
	match: RegExp;
	resolve: (match: RegExpMatchArray, pathname: string) => string | null | undefined;
	statusCode?: RedirectStatusCode;
}

/**
 * Статические HTTP-редиректы проекта (1-в-1).
 * Используются как в routeRules Nitro (nuxt.config.ts), так и в middleware.
 * Добавляйте сюда постоянные правила редиректов вашего проекта.
 */
export const staticAppRedirects: StaticRedirectRule[] = [
	// Шаблонные редиректы: запросы PWA-манифестов и иконок из корня в /favicon/
	{ from: "/site.webmanifest", to: "/favicon/site.webmanifest", statusCode: 301 },
	{ from: "/manifest.json", to: "/favicon/manifest.json", statusCode: 301 },
	{ from: "/apple-touch-icon.png", to: "/favicon/apple-touch-icon.png", statusCode: 301 },
	{ from: "/favicons/", to: "/favicon/favicon.ico", statusCode: 301 },
];

/** Обратная совместимость для существующего nuxt.config.ts и тестов */
export const appRedirects = staticAppRedirects;
export type AppRedirect = StaticRedirectRule;

/**
 * Динамические регулярные редиректы проекта.
 * Обрабатывают паттерны путей, сохраняют параметры и нормализуют слэши.
 */
export const dynamicAppRedirects: DynamicRedirectRule[] = [];

/**
 * Функция построения карты статических редиректов.
 * Поддерживает совпадение как с замыкающим слэшем, так и без него.
 */
export function buildStaticRedirectsMap(
	rules: readonly StaticRedirectRule[]
): Map<string, { to: string; statusCode: RedirectStatusCode }> {
	const map = new Map<string, { to: string; statusCode: RedirectStatusCode }>();

	for (const rule of rules) {
		const code = rule.statusCode ?? 301;
		map.set(rule.from, { to: rule.to, statusCode: code });

		// Добавляем вариант с альтернативным слэшем, если его еще нет
		if (rule.from.endsWith("/")) {
			const withoutSlash = rule.from.slice(0, -1);
			if (!map.has(withoutSlash)) {
				map.set(withoutSlash, { to: rule.to, statusCode: code });
			}
		} else {
			const withSlash = `${rule.from}/`;
			if (!map.has(withSlash)) {
				map.set(withSlash, { to: rule.to, statusCode: code });
			}
		}
	}

	return map;
}

const staticRedirectsMap = buildStaticRedirectsMap(staticAppRedirects);

/**
 * Единая точка резолвинга всех HTTP/SPA редиректов проекта.
 *
 * @param pathname Путь запроса (без query string и hash)
 * @returns Целевой путь и статус-код редиректа или null, если редирект не требуется.
 */
export function resolveAppRedirect(pathname: string): RedirectTarget | null {
	if (!pathname) return null;

	// 1. Проверка статических редиректов
	const staticMatch = staticRedirectsMap.get(pathname);
	if (staticMatch && staticMatch.to !== pathname) {
		return { target: staticMatch.to, statusCode: staticMatch.statusCode };
	}

	// 2. Проверка динамических регулярных правил
	for (const rule of dynamicAppRedirects) {
		const match = pathname.match(rule.match);
		if (!match) continue;

		const target = rule.resolve(match, pathname);
		if (target && target !== pathname) {
			return { target, statusCode: rule.statusCode ?? 301 };
		}
	}

	return null;
}
