const FIXED_HEADER_ELEMENT_ID = "header";

export const DEFAULT_FIXED_HEADER_HEIGHT_PX = 116;

/** Текущая высота фиксированной шапки `#header`. */
export function readFixedHeaderHeightPx(fallbackHeight = DEFAULT_FIXED_HEADER_HEIGHT_PX): number {
	if (!import.meta.client) return fallbackHeight;

	const headerElement = document.getElementById(FIXED_HEADER_ELEMENT_ID);
	return Math.ceil(headerElement?.getBoundingClientRect().height ?? fallbackHeight);
}

export function resolveScrollTopWithOffset(elementTop: number, scrollY: number, offsetPx: number): number {
	return Math.max(0, elementTop + scrollY - offsetPx);
}

export function resolveScrollTopBelowFixedHeader(
	elementTop: number,
	scrollY: number,
	headerHeight: number,
	gapPx = 0
): number {
	return resolveScrollTopWithOffset(elementTop, scrollY, headerHeight + gapPx);
}

export function getReducedMotionScrollBehavior(defaultBehavior: ScrollBehavior = "smooth"): ScrollBehavior {
	if (
		import.meta.client &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		return "instant";
	}

	return defaultBehavior;
}

/** Прокручивает страницу к элементу с учётом суммарного верхнего отступа. */
export function scrollToElementWithOffset(
	element: HTMLElement | null,
	offsetPx: number,
	behavior: ScrollBehavior = "smooth"
): void {
	if (!element || !import.meta.client) return;

	const top = resolveScrollTopWithOffset(element.getBoundingClientRect().top, window.scrollY, offsetPx);

	window.scrollTo({ top, behavior });
}

/** Плавно прокручивает страницу к элементу с учётом фиксированной шапки. */
export function scrollToElementBelowFixedHeader(
	element: HTMLElement | null,
	gapPx = 0,
	behavior: ScrollBehavior = "smooth"
): void {
	scrollToElementWithOffset(element, readFixedHeaderHeightPx() + gapPx, behavior);
}
