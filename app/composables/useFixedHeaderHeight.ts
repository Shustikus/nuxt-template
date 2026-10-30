import { onBeforeUnmount, onMounted, ref } from "vue";
import { DEFAULT_FIXED_HEADER_HEIGHT_PX, readFixedHeaderHeightPx } from "~/utils/fixedHeaderScroll";

/** Высота фиксированной шапки (вся `#header`): меняется при сворачивании верхнего блока. */
export function useFixedHeaderHeight(fallbackHeight = DEFAULT_FIXED_HEADER_HEIGHT_PX) {
	const headerHeight = ref(fallbackHeight);
	let resizeObserver: ResizeObserver | null = null;

	const syncHeaderHeight = (): void => {
		headerHeight.value = readFixedHeaderHeightPx(fallbackHeight);
	};

	onMounted(() => {
		syncHeaderHeight();

		const headerElement = document.getElementById("header");
		if (headerElement && typeof ResizeObserver !== "undefined") {
			resizeObserver = new ResizeObserver(syncHeaderHeight);
			resizeObserver.observe(headerElement);
		}
	});

	onBeforeUnmount(() => {
		resizeObserver?.disconnect();
	});

	return { headerHeight };
}
