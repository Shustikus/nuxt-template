import { afterEach, describe, expect, it } from "vitest";
import { isVitest } from "~/utils/isVitest";

describe("isVitest", () => {
	const originalVitest = process.env.VITEST;

	afterEach(() => {
		if (originalVitest === undefined) {
			delete process.env.VITEST;
		} else {
			process.env.VITEST = originalVitest;
		}
	});

	it("detects Vitest runner env", () => {
		process.env.VITEST = "true";
		expect(isVitest()).toBe(true);

		process.env.VITEST = "1";
		expect(isVitest()).toBe(true);
	});

	it("returns false outside Vitest", () => {
		delete process.env.VITEST;
		expect(isVitest()).toBe(false);
	});
});
