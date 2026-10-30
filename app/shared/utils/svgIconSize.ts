import { computed, toValue, type MaybeRefOrGetter } from "vue";

function normalizeSvgDimension(val: number | string): string {
	if (typeof val === "number") {
		return `${val}px`;
	}
	const str = String(val).trim();
	if (/^-?\d+(\.\d+)?$/.test(str)) {
		return `${str}px`;
	}
	return str;
}

/** Размер кастомной SVG-иконки через CSS — без :width/:height на <svg> (Vue 3.5 + hydration). */
export function resolveSvgIconSizeStyle(size: number | string): { width: string; height: string } {
	const value = normalizeSvgDimension(size);

	return { width: value, height: value };
}

export function resolveSvgIconBoxStyle(
	width: number | string,
	height: number | string
): { width: string; height: string } {
	return { width: normalizeSvgDimension(width), height: normalizeSvgDimension(height) };
}

export function useSvgIconSize(size: MaybeRefOrGetter<number | string>) {
	return computed(() => resolveSvgIconSizeStyle(toValue(size)));
}

export function useSvgIconBox(width: MaybeRefOrGetter<number | string>, height: MaybeRefOrGetter<number | string>) {
	return computed(() => resolveSvgIconBoxStyle(toValue(width), toValue(height)));
}
