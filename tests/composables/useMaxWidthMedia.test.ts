import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMaxWidthMedia } from "~/composables/useMaxWidthMedia";

function createMatchMedia(matches: boolean) {
	const listeners = new Set<(event: MediaQueryListEvent) => void>();
	const mql = {
		matches,
		media: "",
		addEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
			listeners.add(listener);
		}),
		removeEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
			listeners.delete(listener);
		}),
		dispatch(nextMatches: boolean) {
			(mql as { matches: boolean }).matches = nextMatches;
			listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
		},
	} as unknown as MediaQueryList & { dispatch(nextMatches: boolean): void };

	return mql;
}

function mountMaxWidthMediaProbe(maxWidthPx = 707) {
	return mount(
		defineComponent({
			setup() {
				const matches = useMaxWidthMedia(maxWidthPx);
				return { matches };
			},
			template: "<span>{{ matches }}</span>",
		})
	);
}

describe("useMaxWidthMedia", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("синхронизирует matches сразу при setup на клиенте и очищает listener при unmount", async () => {
		const mql = createMatchMedia(true);
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => mql)
		);

		const wrapper = mountMaxWidthMediaProbe();
		await nextTick();

		expect(wrapper.text()).toBe("true");

		wrapper.unmount();
		expect(mql.removeEventListener).toHaveBeenCalled();
	});

	it("обновляет matches при change события matchMedia", async () => {
		const mql = createMatchMedia(false);
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => mql)
		);

		const wrapper = mountMaxWidthMediaProbe();
		await nextTick();
		expect(wrapper.text()).toBe("false");

		mql.dispatch(true);
		await nextTick();
		expect(wrapper.text()).toBe("true");

		wrapper.unmount();
	});

	it("корректно обрабатывает отсутствие matchMedia при setup", async () => {
		vi.stubGlobal("matchMedia", undefined);

		const wrapper = mountMaxWidthMediaProbe();
		await nextTick();
		expect(wrapper.text()).toBe("false");

		wrapper.unmount();
	});
});
