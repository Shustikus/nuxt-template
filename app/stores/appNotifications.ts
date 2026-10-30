import { defineStore } from "pinia";
import { nextTick, ref } from "vue";
import {
	applyNotificationRelease,
	applyNotificationRequestShow,
	type AppNotificationId,
} from "~/utils/appNotificationQueueLogic";

/** Стек глобальных тостов: несколько уведомлений одновременно, визуально друг под другом. */
export const useAppNotificationsStore = defineStore("appNotifications", () => {
	const visibleStack = ref<AppNotificationId[]>([]);

	function isVisible(id: AppNotificationId): boolean {
		return visibleStack.value.includes(id);
	}

	function requestShow(id: AppNotificationId): void {
		const bumpToTop = (): void => {
			visibleStack.value = applyNotificationRequestShow({ visibleStack: visibleStack.value }, id).visibleStack;
		};

		if (!visibleStack.value.includes(id)) {
			bumpToTop();
			return;
		}

		// Повторный показ: снять со стека и вернуть — чтобы сработала анимация TransitionGroup.
		visibleStack.value = applyNotificationRelease({ visibleStack: visibleStack.value }, id).visibleStack;
		nextTick(bumpToTop);
	}

	function release(id: AppNotificationId): void {
		visibleStack.value = applyNotificationRelease({ visibleStack: visibleStack.value }, id).visibleStack;
	}

	return { visibleStack, isVisible, requestShow, release };
});
