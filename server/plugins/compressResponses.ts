import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import {
	appendResponseHeader,
	defaultContentType,
	getMethod,
	getRequestHeader,
	getResponseHeader,
	isStream,
	isWebResponse,
	removeResponseHeader,
	setResponseHeader,
} from "h3";
import { defineNitroPlugin } from "nitropack/runtime/plugin";

/** Порог, ниже которого сжатие не окупается (оверхед на маленьких телах). */
const MIN_COMPRESSIBLE_BYTES = 1024;

/**
 * Уровень brotli: 5 — баланс сжатия и CPU на запрос.
 * Максимум (11) на SSR-HTML даёт сотни мс задержки сервера.
 */
const BROTLI_QUALITY = 5;

/** Коды ответа без тела — сжимать нечего. */
const BODYLESS_STATUSES = new Set([101, 204, 205, 304]);

interface ExtractedBody {
	payload: Buffer;
	/** Fallback Content-Type, если хендлер его не выставил (как h3 делает сам). */
	contentType?: string;
}

/**
 * Сжатие динамических ответов Nitro (SSR HTML и JSON API): h3 сжимает только
 * готовую статику из public/, а документ и API отдаются без content-encoding.
 *
 * Сжимаем только настоящие клиентские запросы: внутренние вызовы Nitro
 * (SSR $fetch через node-mock-http, prerender) не присылают accept-encoding,
 * но проходят через этот же хук — сжатие для них означало бы нечитаемые байты
 * в $fetch и gzip-файлы в index.html при SSG.
 */
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("beforeResponse", (event, response) => {
		const body = response.body;
		if (body === undefined || body === null) return;
		if (BODYLESS_STATUSES.has(event.node.res.statusCode)) return;
		if (getMethod(event) === "HEAD") return;
		if (getResponseHeader(event, "content-encoding")) return;

		// Внутренние вызовы Nitro (рендер страницы ошибки через localFetch, prerender)
		// не должны сжиматься, иначе localFetch res.text() вернёт повреждённый UTF-8.
		if (
			event.path?.startsWith("/__nuxt_error") ||
			Boolean(getRequestHeader(event, "x-nuxt-error")) ||
			Boolean(getRequestHeader(event, "x-nitro-prerender"))
		) {
			return;
		}

		const acceptEncoding = String(getRequestHeader(event, "accept-encoding") ?? "");
		const useBrotli = acceptEncoding.includes("br");
		if (!useBrotli && !acceptEncoding.includes("gzip")) return;

		const extracted = extractBody(body);
		if (!extracted || extracted.payload.length < MIN_COMPRESSIBLE_BYTES) return;

		const compressed = useBrotli
			? brotliCompressSync(extracted.payload, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY } })
			: gzipSync(extracted.payload, { level: 6 });
		if (compressed.length >= extracted.payload.length) return;

		if (extracted.contentType) {
			defaultContentType(event, extracted.contentType);
		}
		setResponseHeader(event, "content-encoding", useBrotli ? "br" : "gzip");
		appendResponseHeader(event, "vary", "Accept-Encoding");
		removeResponseHeader(event, "content-length");

		response.body = compressed;
	});
});

/** Приводит тело ответа к байтам; возвращает null для несжимаемых тел (стримы, Web Response, ошибки). */
function extractBody(body: unknown): ExtractedBody | null {
	if (typeof body === "string") {
		return { payload: Buffer.from(body, "utf8"), contentType: "text/html" };
	}
	if (Buffer.isBuffer(body)) {
		return { payload: body };
	}
	if (body instanceof Uint8Array) {
		return { payload: Buffer.from(body) };
	}
	if (
		typeof body === "object" &&
		!isWebResponse(body) &&
		!isStream(body) &&
		!(body instanceof Error) &&
		typeof (body as { arrayBuffer?: unknown }).arrayBuffer !== "function" &&
		typeof (body as { end?: unknown }).end !== "function"
	) {
		try {
			// JSON-хендлеры возвращают объекты — сериализуем как это делает h3.
			const json = JSON.stringify(body);
			if (typeof json !== "string") return null;
			return { payload: Buffer.from(json, "utf8"), contentType: "application/json" };
		} catch {
			return null;
		}
	}
	return null;
}
