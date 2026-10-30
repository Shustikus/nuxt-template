import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { useAppNotificationsStore } from "~/stores/appNotifications";

describe("useAppNotificationsStore", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it("shows a notification and reports visibility", () => {
		const store = useAppNotificationsStore();

		expect(store.isVisible("toast-1")).toBe(false);

		store.requestShow("toast-1");

		expect(store.isVisible("toast-1")).toBe(true);
		expect(store.visibleStack).toEqual(["toast-1"]);
	});

	it("appends new notifications on top of the stack", () => {
		const store = useAppNotificationsStore();

		store.requestShow("toast-1");
		store.requestShow("toast-2");

		// Порядок снизу вверх: последний запрошенный — выше.
		expect(store.visibleStack).toEqual(["toast-1", "toast-2"]);
	});

	it("releases a notification from the stack", () => {
		const store = useAppNotificationsStore();

		store.requestShow("toast-1");
		store.requestShow("toast-2");
		store.release("toast-1");

		expect(store.isVisible("toast-1")).toBe(false);
		expect(store.visibleStack).toEqual(["toast-2"]);
	});

	it("re-shows an already visible notification by re-adding it after a tick", async () => {
		const store = useAppNotificationsStore();

		store.requestShow("toast-1");
		store.requestShow("toast-2");

		store.requestShow("toast-1");
		expect(store.isVisible("toast-1")).toBe(false);

		await nextTick();

		expect(store.isVisible("toast-1")).toBe(true);
		expect(store.visibleStack).toEqual(["toast-2", "toast-1"]);
	});
});
