import { describe, expect, it, beforeEach } from "vitest";
import { ensureYandexMetrikaGlobals } from "~/utils/yandexMetrikaGlobals";
import { YANDEX_METRIKA_ID } from "~/config/metrics";

describe("ensureYandexMetrikaGlobals", () => {
	beforeEach(() => {
		delete (window as unknown as { Ya?: unknown }).Ya;
		delete (window as unknown as { ym?: unknown }).ym;
		delete (window as unknown as { dataLayer?: unknown }).dataLayer;
	});

	it("provides Ya.Metrika.counters() and Ya.Metrika2.counters() functions", () => {
		ensureYandexMetrikaGlobals();

		expect(window.Ya).toBeDefined();
		expect(window.Ya?.Metrika).toBeDefined();
		expect(window.Ya?.Metrika2).toBeDefined();

		expect(typeof window.Ya?.Metrika?.counters).toBe("function");
		expect(typeof window.Ya?.Metrika2?.counters).toBe("function");

		const counters1 = window.Ya?.Metrika?.counters?.();
		const counters2 = window.Ya?.Metrika2?.counters?.();

		expect(Array.isArray(counters1)).toBe(true);
		expect(Array.isArray(counters2)).toBe(true);

		expect(counters1?.length).toBeGreaterThan(0);
		expect(counters1?.[0].id).toBe(YANDEX_METRIKA_ID);

		const counter = counters1?.[0];
		expect(counter).toBeDefined();
		if (counter) {
			counter.reachGoal();
			counter.userParams();
			counter.hit();
			counter.params();
			counter.extLink();
			counter.file();
			counter.notBounce();
			counter.addFileExtension();

			let clientId = "";
			counter.getClientID((id) => {
				clientId = id;
			});
			expect(clientId).toBe("dev-client-id");
			expect(counter.getClientID()).toBeUndefined();
		}
	});

	it("queues calls to window.ym and preserves existing ym instance on multiple calls", () => {
		ensureYandexMetrikaGlobals();

		expect(typeof window.ym).toBe("function");
		window.ym?.("reachGoal", "test-goal", { key: "value" });
		expect(window.ym?.a?.length).toBe(1);
		expect(window.ym?.a?.[0]).toEqual(["reachGoal", "test-goal", { key: "value" }]);

		const existingYm = window.ym;
		ensureYandexMetrikaGlobals();
		expect(window.ym).toBe(existingYm);
	});

	it("allows instantiating new counters and calling without new", () => {
		ensureYandexMetrikaGlobals();

		const Metrika2Ctor = window.Ya?.Metrika2;
		expect(Metrika2Ctor).toBeDefined();

		if (Metrika2Ctor) {
			const customInstance = new Metrika2Ctor(999999);
			expect(customInstance.id).toBe(999999);

			// Вызов без new
			const MetrikaCtor = window.Ya?.Metrika;
			const fnInstance = (MetrikaCtor as unknown as (id?: number) => { id: number })?.(888888);
			expect(fnInstance?.id).toBe(888888);

			// Вызов с нечисловым id fallback на YANDEX_METRIKA_ID
			const fallbackInstance = (MetrikaCtor as unknown as (id?: unknown) => { id: number })?.("invalid");
			expect(fallbackInstance?.id).toBe(YANDEX_METRIKA_ID);

			const allCounters = window.Ya?.Metrika?.counters?.();
			const ids = allCounters?.map((c) => c.id);
			expect(ids).toContain(999999);
			expect(ids).toContain(888888);
			expect(ids).toContain(YANDEX_METRIKA_ID);
		}
	});

	it("safe-guards existing Ya.Metrika and Ya.Metrika2 without counters property", () => {
		(window as unknown as { Ya?: unknown }).Ya = { Metrika: function () {}, Metrika2: function () {} };

		ensureYandexMetrikaGlobals();

		expect(typeof window.Ya?.Metrika?.counters).toBe("function");
		expect(typeof window.Ya?.Metrika2?.counters).toBe("function");
		const counters = window.Ya?.Metrika?.counters?.();
		expect(Array.isArray(counters)).toBe(true);
		expect(counters?.[0].id).toBe(YANDEX_METRIKA_ID);
	});

	it("returns fallback defaultCounter when countersMap is empty", () => {
		ensureYandexMetrikaGlobals();
		if (window.Ya?._metrika?.counters) {
			for (const key of Object.keys(window.Ya._metrika.counters)) {
				delete (window.Ya._metrika.counters as Record<string, unknown>)[key];
			}
			const list = window.Ya.Metrika?.counters?.();
			expect(list?.length).toBe(1);
			expect(list?.[0].id).toBe(YANDEX_METRIKA_ID);
		}
	});
});
