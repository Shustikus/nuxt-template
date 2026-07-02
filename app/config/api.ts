/** Префикс Nitro- и клиентских API-роутов (фиксированный, без env). */
export const API_BASE_PATH = "/api";

/** Origin бэкенда при `nuxt dev` / локальной разработке. */
export const LOCAL_BACKEND_ORIGIN = "http://localhost:8080";

/** Канонический URL продакшена (SEO при сборке, fallback origin). */
export const PRODUCTION_SITE_URL = "https://example.com";

export interface BackendUrlOptions {
	/** `NUXT_API_BASE_URL` — принудительный origin (Docker, staging, отдельный API). */
	apiBaseUrlOverride?: string;
	/** `NUXT_PUBLIC_SITE_URL` — опционально для SEO и fallback origin без HTTP-запроса. */
	siteUrl?: string;
	/** Origin текущего запроса (для тестов; иначе берётся из `useRequestURL()`). */
	requestOrigin?: string;
	isDev?: boolean;
}

function normalizePath(path: string): string {
	return path.startsWith("/") ? path : `/${path}`;
}

function stripTrailingSlash(value: string): string {
	return value.replace(/\/$/, "");
}

function readRequestOrigin(): string | undefined {
	try {
		return useRequestURL().origin;
	} catch {
		return undefined;
	}
}

/**
 * Origin бэкенда для Nitro-прокси.
 * Dev → `localhost:8080`, prod → origin запроса → siteUrl → `PRODUCTION_SITE_URL`.
 */
export function resolveBackendOrigin(options: BackendUrlOptions = {}): string {
	const override = options.apiBaseUrlOverride?.trim();
	if (override) return stripTrailingSlash(override);

	if (options.isDev ?? import.meta.dev) return LOCAL_BACKEND_ORIGIN;

	const requestOrigin = options.requestOrigin ?? readRequestOrigin();
	if (requestOrigin) return stripTrailingSlash(requestOrigin);

	const siteUrl = options.siteUrl?.trim();
	if (siteUrl) return stripTrailingSlash(siteUrl);

	return PRODUCTION_SITE_URL;
}

/** Относительный URL Nitro-роута: `/api` + path. */
export function buildApiUrl(path: string): string {
	return `${API_BASE_PATH}${normalizePath(path)}`;
}

function readBackendUrlOptions(): BackendUrlOptions {
	try {
		const config = useRuntimeConfig();
		return { apiBaseUrlOverride: String(config.apiBaseUrl ?? ""), siteUrl: String(config.public.siteUrl ?? "") };
	} catch {
		return {};
	}
}

/** Абсолютный URL бэкенда для server-side прокси. */
export function buildBackendApiUrl(path: string, options?: BackendUrlOptions): string {
	const resolved = { ...readBackendUrlOptions(), ...options };
	return `${resolveBackendOrigin(resolved)}${buildApiUrl(path)}`;
}
