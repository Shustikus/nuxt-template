import { onMounted, onUnmounted, ref } from "vue";

function readMatchMedia(queryText: string): MediaQueryList | null {
	if (!import.meta.client || typeof window.matchMedia !== "function") {
		return null;
	}

	return window.matchMedia(queryText);
}

/**
 * Реактивное состояние `matchMedia("(max-width: px)")`: удобная обёртка над `BREAKPOINTS`.
 * SSR-значение — `false`, и клиент при гидратации стартует с того же `false`
 * (синхронное чтение matchMedia в setup дало бы hydration mismatch на v-if),
 * фактическое значение подставляется в `onMounted`.
 */
export function useMaxWidthMedia(maxWidthPx: number) {
	const matchesMaxWidth = ref(false);
	const queryText = `(max-width: ${maxWidthPx}px)`;
	let mediaQueryList: MediaQueryList | null = readMatchMedia(queryText);

	const syncMatches = (): void => {
		if (mediaQueryList) {
			matchesMaxWidth.value = mediaQueryList.matches;
		}
	};

	onMounted(() => {
		if (!mediaQueryList) {
			mediaQueryList = readMatchMedia(queryText);
		}

		syncMatches();
		mediaQueryList?.addEventListener("change", syncMatches);
	});

	onUnmounted(() => {
		mediaQueryList?.removeEventListener("change", syncMatches);
		mediaQueryList = null;
	});

	return matchesMaxWidth;
}
