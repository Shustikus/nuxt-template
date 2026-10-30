import { computed, onMounted, shallowRef, type ComputedRef, type ShallowRef } from "vue";

/**
 * false до onMounted компонента — совпадает с SSR.
 * Нужен для client-only state (localStorage), когда async-layout гидратируется позже app:mounted.
 */
export function useClientUiReady(): ShallowRef<boolean> {
	const isReady = shallowRef(false);

	onMounted(() => {
		isReady.value = true;
	});

	return isReady;
}

/** Значение из client-only источника; до onMounted — fallback (обычно SSR-значение). */
export function useSsrSafeClientValue<T>(getValue: () => T, fallback: T): ComputedRef<T> {
	const isReady = useClientUiReady();

	return computed(() => (isReady.value ? getValue() : fallback));
}
