import { describe, expect, it } from "vitest";
import { readNuxtAsyncDataCache } from "~/utils/readNuxtAsyncDataCache";

describe("readNuxtAsyncDataCache", () => {
	it("читает значение из payload, затем из static", () => {
		const nuxtApp = { payload: { data: { key: "payload" } }, static: { data: { key: "static" } } };

		expect(readNuxtAsyncDataCache<string>("key", nuxtApp as never)).toBe("payload");
		expect(
			readNuxtAsyncDataCache<string>("missing", {
				payload: { data: {} },
				static: { data: { missing: "static" } },
			} as never)
		).toBe("static");
	});

	it("не возвращает кеш при refetch после мутации (cause: watch)", () => {
		const nuxtApp = { payload: { data: { key: "stale" } }, static: { data: {} } };

		expect(readNuxtAsyncDataCache<string>("key", nuxtApp as never, { cause: "watch" })).toBeUndefined();
	});
});
