import { FetchError } from "ofetch";

function readMessageFromPayload(data: unknown): string | undefined {
	if (!data || typeof data !== "object") return undefined;

	const record = data as Record<string, unknown>;

	if (Array.isArray(record.errors) && record.errors.length > 0) {
		const first = record.errors[0];
		if (typeof first === "string" && first.trim().length > 0) return first.trim();
		if (first && typeof first === "object" && "message" in first) {
			const msg = (first as { message?: unknown }).message;
			if (typeof msg === "string" && msg.trim().length > 0) return msg.trim();
		}
	}

	const detail = record.detail;
	if (typeof detail === "string" && detail.trim().length > 0) {
		return detail.trim();
	}

	const message = record.message;
	if (typeof message === "string" && message.trim().length > 0) {
		return message.trim();
	}

	return undefined;
}

function readStatusFromPayload(data: unknown): number | undefined {
	if (!data || typeof data !== "object") return undefined;

	const status = (data as { status?: unknown }).status;
	return typeof status === "number" ? status : undefined;
}

function readHttpStatusCode(error: unknown): number | undefined {
	if (!error || typeof error !== "object") return undefined;

	const record = error as Record<string, unknown>;

	if (typeof record.statusCode === "number") return record.statusCode;
	if (typeof record.status === "number") return record.status;

	const response = record.response;
	if (response && typeof response === "object") {
		const responseStatus = (response as { status?: unknown }).status;
		if (typeof responseStatus === "number") return responseStatus;
	}

	return readStatusFromPayload(record.data);
}

/** HTTP-код из FetchError, H3Error и problem+json; для прочих ошибок — fallback. */
export function resolveApiErrorStatus(error: unknown, fallbackStatus = 500): number {
	return readHttpStatusCode(error) ?? fallbackStatus;
}

/** Текст ошибки из ответа Nitro или problem+json (`message` / `detail`). */
export function extractApiErrorMessage(error: unknown): string | undefined {
	if (error instanceof FetchError) {
		return readMessageFromPayload(error.data);
	}

	if (error && typeof error === "object" && "data" in error) {
		return readMessageFromPayload((error as { data?: unknown }).data);
	}

	if (error && typeof error === "object" && "message" in error) {
		const message = (error as { message?: unknown }).message;
		if (typeof message === "string" && message.trim().length > 0) {
			return message.trim();
		}
	}

	return undefined;
}
