/** Идентификаторы глобальных тостов в нижней зоне (стек друг под другом). */
export type AppNotificationId = string;

export interface AppNotificationQueueState {
	/** Порядок снизу вверх: первый в списке — ниже, последний — выше. */
	visibleStack: AppNotificationId[];
}

export function createAppNotificationQueueState(): AppNotificationQueueState {
	return { visibleStack: [] };
}

export function applyNotificationRequestShow(
	state: AppNotificationQueueState,
	id: AppNotificationId
): AppNotificationQueueState {
	const without = state.visibleStack.filter((item) => item !== id);
	return { visibleStack: [...without, id] };
}

export function applyNotificationRelease(
	state: AppNotificationQueueState,
	id: AppNotificationId
): AppNotificationQueueState {
	return { visibleStack: state.visibleStack.filter((item) => item !== id) };
}
