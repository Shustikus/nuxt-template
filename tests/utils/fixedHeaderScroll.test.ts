import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_FIXED_HEADER_HEIGHT_PX,
	getReducedMotionScrollBehavior,
	readFixedHeaderHeightPx,
	resolveScrollTopBelowFixedHeader,
	resolveScrollTopWithOffset,
	scrollToElementBelowFixedHeader,
	scrollToElementWithOffset,
} from "~/utils/fixedHeaderScroll";

describe("fixedHeaderScroll", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		document.body.innerHTML = "";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("readFixedHeaderHeightPx", () => {
		it("возвращает fallback, если элемент #header отсутствует в DOM", () => {
			expect(readFixedHeaderHeightPx()).toBe(DEFAULT_FIXED_HEADER_HEIGHT_PX);
			expect(readFixedHeaderHeightPx(90)).toBe(90);
		});

		it("возвращает округлённую высоту найденного #header", () => {
			const header = document.createElement("header");
			header.id = "header";
			header.getBoundingClientRect = vi.fn().mockReturnValue({ height: 75.4 });
			document.body.appendChild(header);

			expect(readFixedHeaderHeightPx()).toBe(76);
		});
	});

	describe("resolveScrollTopWithOffset and resolveScrollTopBelowFixedHeader", () => {
		it("вычитает смещение и не опускается ниже 0", () => {
			expect(resolveScrollTopWithOffset(300, 200, 100)).toBe(400);
			expect(resolveScrollTopWithOffset(50, 0, 100)).toBe(0);
			expect(resolveScrollTopBelowFixedHeader(400, 200, 116, 16)).toBe(468);
		});
	});

	describe("getReducedMotionScrollBehavior", () => {
		it("возвращает 'instant', если пользователь предпочитает уменьшение движения", () => {
			vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
			expect(getReducedMotionScrollBehavior("smooth")).toBe("instant");
		});

		it("возвращает defaultBehavior, если reduced motion отключён", () => {
			vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
			expect(getReducedMotionScrollBehavior("smooth")).toBe("smooth");
		});

		it("возвращает defaultBehavior, если matchMedia недоступен", () => {
			vi.stubGlobal("matchMedia", undefined);
			expect(getReducedMotionScrollBehavior("smooth")).toBe("smooth");
		});
	});

	describe("scrollToElementWithOffset and scrollToElementBelowFixedHeader", () => {
		it("ничего не делает, если элемент null", () => {
			const scrollToSpy = vi.fn();
			window.scrollTo = scrollToSpy;

			scrollToElementWithOffset(null, 50);
			expect(scrollToSpy).not.toHaveBeenCalled();
		});

		it("прокручивает страницу к элементу с отступом", () => {
			const scrollToSpy = vi.fn();
			window.scrollTo = scrollToSpy;

			const target = document.createElement("div");
			target.getBoundingClientRect = vi.fn().mockReturnValue({ top: 300 });
			Object.defineProperty(window, "scrollY", { value: 100, writable: true });

			scrollToElementWithOffset(target, 80, "smooth");
			expect(scrollToSpy).toHaveBeenCalledWith({ top: 320, behavior: "smooth" });
		});

		it("прокручивает страницу к элементу с учётом фиксированной шапки и gap", () => {
			const scrollToSpy = vi.fn();
			window.scrollTo = scrollToSpy;

			const target = document.createElement("div");
			target.getBoundingClientRect = vi.fn().mockReturnValue({ top: 500 });
			Object.defineProperty(window, "scrollY", { value: 0, writable: true });

			scrollToElementBelowFixedHeader(target, 20, "smooth");
			// DEFAULT_FIXED_HEADER_HEIGHT_PX = 116 + 20 = 136, 500 - 136 = 364
			expect(scrollToSpy).toHaveBeenCalledWith({ top: 364, behavior: "smooth" });
		});
	});
});
