import { describe, expect, it } from "vitest";
import { copyToClipboard } from "~/utils/copyToClipboard";
import {
	getReducedMotionScrollBehavior,
	readFixedHeaderHeightPx,
	scrollToElementWithOffset,
} from "~/utils/fixedHeaderScroll";
import { ensureYandexMetrikaGlobals } from "~/utils/yandexMetrikaGlobals";

describe("client utils on server environment", () => {
	it("returns false from copyToClipboard when executed on server", async () => {
		const result = await copyToClipboard("server-test");
		expect(result).toBe(false);
	});

	it("returns fallback height from readFixedHeaderHeightPx on server", () => {
		expect(readFixedHeaderHeightPx(80)).toBe(80);
	});

	it("returns default behavior from getReducedMotionScrollBehavior on server", () => {
		expect(getReducedMotionScrollBehavior("auto")).toBe("auto");
	});

	it("safely handles scrollToElementWithOffset on server without errors", () => {
		expect(() => scrollToElementWithOffset({} as never, 50)).not.toThrow();
	});

	it("safely no-ops ensureYandexMetrikaGlobals when window is undefined", () => {
		expect(() => ensureYandexMetrikaGlobals()).not.toThrow();
	});
});
