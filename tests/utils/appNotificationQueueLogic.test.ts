import { describe, expect, it } from "vitest";
import {
	applyNotificationRelease,
	applyNotificationRequestShow,
	createAppNotificationQueueState,
} from "~/utils/appNotificationQueueLogic";

describe("appNotificationQueueLogic", () => {
	it("добавляет тосты в стек без замены предыдущих", () => {
		let state = createAppNotificationQueueState();

		state = applyNotificationRequestShow(state, "toast-1");
		state = applyNotificationRequestShow(state, "toast-2");

		expect(state.visibleStack).toEqual(["toast-1", "toast-2"]);
	});

	it("при повторном показе переносит тост в конец стека", () => {
		let state = createAppNotificationQueueState();

		state = applyNotificationRequestShow(state, "toast-1");
		state = applyNotificationRequestShow(state, "toast-2");
		state = applyNotificationRequestShow(state, "toast-1");

		expect(state.visibleStack).toEqual(["toast-2", "toast-1"]);
	});

	it("удаляет только указанный тост из стека", () => {
		let state = createAppNotificationQueueState();

		state = applyNotificationRequestShow(state, "toast-1");
		state = applyNotificationRequestShow(state, "toast-2");
		state = applyNotificationRequestShow(state, "toast-3");

		state = applyNotificationRelease(state, "toast-2");

		expect(state.visibleStack).toEqual(["toast-1", "toast-3"]);
	});
});
