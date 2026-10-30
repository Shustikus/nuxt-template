import type { H3Event } from "h3";
import { setResponseHeader, setResponseStatus } from "h3";
import { $fetch as ofetch } from "ofetch";
import { asUntypedFetch } from "~/utils/untypedFetch";

export type ProxyRequestBody = Record<string, unknown> | BodyInit | null | undefined;

export function isProxyTestEnv(): boolean {
	if ((globalThis as { __VITEST__?: boolean }).__VITEST__) return true;
	return process.env.VITEST === "true" || process.env.VITEST === "1";
}

export function getServerFetch() {
	return asUntypedFetch((globalThis as { $fetch?: unknown }).$fetch ?? ofetch);
}

export interface BackendRetryOptions {
	retry?: number;
	retryDelay?: number;
	retryStatusCodes?: number[];
	[key: string]: unknown;
}

/**
 * Опции повторных попыток при кратковременной недоступности бэкенда
 * (например, перезапуск контейнеров при rolling deploy).
 */
export function getBackendRetryOptions(isSafeMethod = true): BackendRetryOptions | undefined {
	if (isProxyTestEnv() || !isSafeMethod) {
		return undefined;
	}

	return { retry: 3, retryDelay: 500, retryStatusCodes: [502, 503, 504] };
}

export function toProxyRequestBody(body: unknown): ProxyRequestBody {
	return body as ProxyRequestBody;
}

export function assertBackendResponseData<T>(data: T | undefined): T {
	if (data === undefined) {
		throw new Error("Backend returned an empty response body");
	}

	return data;
}

function readBackendErrorResponse(error: unknown): { status?: number; data?: unknown; headers?: Headers } {
	if (!error || typeof error !== "object") return {};

	const value = error as {
		status?: unknown;
		statusCode?: unknown;
		data?: unknown;
		response?: { status?: unknown; _data?: unknown; headers?: Headers };
	};
	const statusValue = value.response?.status ?? value.statusCode ?? value.status;

	return {
		status: typeof statusValue === "number" ? statusValue : undefined,
		data: value.response?._data ?? value.data,
		headers: value.response?.headers,
	};
}

/** Возвращает клиенту исходный status и body ответа backend без H3 error envelope. */
export function forwardBackendError<T>(event: H3Event, error: unknown): T {
	const response = readBackendErrorResponse(error);

	if (response.status !== undefined && response.data !== undefined) {
		if ("node" in event && event.node) {
			setResponseStatus(event, response.status);

			const contentType = response.headers?.get("content-type");
			if (contentType) setResponseHeader(event, "content-type", contentType);
		}

		return response.data as T;
	}

	throw error;
}
