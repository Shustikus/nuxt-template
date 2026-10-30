import { describe, expect, it, vi } from "vitest";
import { isMetricsTrackingEnabled } from "~/utils/isMetricsTrackingEnabled";
import * as vitestUtil from "~/utils/isVitest";

describe("isMetricsTrackingEnabled", () => {
	it("возвращает false при выполнении внутри Vitest", () => {
		expect(isMetricsTrackingEnabled()).toBe(false);
	});

	it("возвращает true в production вне тестов", () => {
		vi.spyOn(vitestUtil, "isVitest").mockReturnValue(false);
		expect(isMetricsTrackingEnabled()).toBe(true);
	});
});
