import { $fetch as ofetch } from "ofetch";
import { buildApiUrl } from "~/config/api";
import { isVitest } from "~/utils/isVitest";
import { asUntypedFetch, type UntypedFetch } from "~/utils/untypedFetch";

export interface ApiFetchOptions {
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: unknown;
	signal?: AbortSignal;
}

export type ApiFetchFn = <T>(path: string, options?: ApiFetchOptions) => Promise<T>;

function resolveApiUrl(path: string): string {
	return path.startsWith("/api/") ? path : buildApiUrl(path);
}

let defaultClient: UntypedFetch | undefined;

/** Nuxt `$fetch` на globalThis; fallback на ofetch (Vitest, ранний import). */
function getDefaultClient(): UntypedFetch {
	if (!defaultClient) {
		const fetchFn = (globalThis as { $fetch?: unknown }).$fetch ?? ofetch;
		defaultClient = asUntypedFetch(fetchFn);
	}
	return defaultClient;
}

function runApiFetch<T>(client: UntypedFetch, path: string, options: ApiFetchOptions = {}): Promise<T> {
	const { method = "GET", body, signal } = options;

	return client(resolveApiUrl(path), { method, body, signal }) as Promise<T>;
}

/** Дефолтный клиент для сервисов без SSR-контекста. */
export const defaultApiFetch: ApiFetchFn = <T>(path: string, options?: ApiFetchOptions) =>
	runApiFetch<T>(getDefaultClient(), path, options);

/** GET/POST к Nitro `/api/*` через `$fetch`. Путь — без префикса `/api` (например `/brands`). */
export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
	return runApiFetch<T>(getDefaultClient(), path, options);
}

export async function apiGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
	return apiFetch<T>(path, { method: "GET", signal: options?.signal });
}

export async function apiPost<T>(path: string, body: unknown, options?: { signal?: AbortSignal }): Promise<T> {
	return apiFetch<T>(path, { method: "POST", body, signal: options?.signal });
}

/**
 * GET с fallback на демо-данные — только в Vitest (MSW перехватывает запросы).
 * В dev и production ошибка пробрасывается наверх.
 */
export async function apiGetWithFallback<T>(path: string, fallback: T): Promise<T> {
	try {
		return await apiGet<T>(path);
	} catch (error) {
		if (isVitest()) return fallback;
		throw error;
	}
}

/** Привязывает `useRequestFetch()` для SSR-запросов с контекстом текущего HTTP-запроса. */
export function createApiFetch(fetch: unknown): ApiFetchFn {
	const client = asUntypedFetch(fetch);
	return <T>(path: string, options?: ApiFetchOptions) => runApiFetch<T>(client, path, options);
}
