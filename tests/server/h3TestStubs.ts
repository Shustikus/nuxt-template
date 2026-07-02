import { vi } from "vitest";

type StubbedCreateErrorPayload = { statusCode?: number; statusMessage?: string; message?: string };

/** Минимальные глобалы h3/Nuxt для прямого вызова server handlers в node-тестах. */
export function stubDefineEventHandler() {
	vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
}

export function stubGetRouterParam(getter: (event: unknown, name: string) => string | undefined) {
	vi.stubGlobal("getRouterParam", getter);
}

export function stubReadMultipartFormData(
	reader: (event: unknown) => Promise<Array<{ name?: string; data?: unknown }> | undefined>
) {
	vi.stubGlobal("readMultipartFormData", reader);
}

export function stubCreateError() {
	vi.stubGlobal("createError", (payload: StubbedCreateErrorPayload) => {
		const err = new Error(payload.message || payload.statusMessage || "Error");
		Object.assign(err, payload);
		return err;
	});
}

export function stubReadBody(reader: (event: unknown) => Promise<unknown>) {
	vi.stubGlobal("readBody", reader);
}

export function stubGetQuery(getter: (event: unknown) => Record<string, unknown>) {
	vi.stubGlobal("getQuery", getter);
}

export function stubSetResponseHeaders() {
	vi.stubGlobal("setResponseHeaders", vi.fn());
}

export function stubUseRuntimeConfig(config: unknown) {
	vi.stubGlobal("useRuntimeConfig", () => config);
}
