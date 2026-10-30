import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAppNotificationsStore } from "~/stores/appNotifications";
import type { AppNotificationId } from "~/utils/appNotificationQueueLogic";

/** Фасад над Pinia-стором очереди тостов. */
export function useAppNotificationQueue() {
	const store = useAppNotificationsStore();
	const { visibleStack } = storeToRefs(store);

	return { visibleStack, isVisible: store.isVisible, requestShow: store.requestShow, release: store.release };
}

/** v-model и show/hide для тоста в общем стеке. */
export function useQueuedNotificationVisibility(id: AppNotificationId) {
	const store = useAppNotificationsStore();

	const visible = computed({
		get: () => store.isVisible(id),
		set: (value: boolean) => {
			if (!value) {
				store.release(id);
			}
		},
	});

	return { visible, show: () => store.requestShow(id), hide: () => store.release(id) };
}
