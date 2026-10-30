import { createError, getRouterParam, type H3Event } from "h3";

/**
 * Безопасно извлекает и URI-кодирует параметр роута Nitro.
 * Защищает от path traversal (отклоняет слеши и пустые значения).
 */
export function getEncodedRouterParam(event: H3Event, name: string): string {
	const value = getRouterParam(event, name);
	if (!value || value.includes("/") || value.includes("\\")) {
		throw createError({ statusCode: 400, statusMessage: `Invalid ${name}` });
	}

	return encodeURIComponent(value);
}
