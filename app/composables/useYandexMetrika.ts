/* eslint-disable no-console -- dev and diagnostic logging for metrics */
import { YANDEX_METRIKA_ID } from "~/config/metrics";
import { isMetricsTrackingEnabled } from "~/utils/isMetricsTrackingEnabled";

/**
 * @description Универсальный хук для отправки событий в Яндекс.Метрику
 *   (`reachGoal` — цели, `userParams` — параметры посетителей).
 *   Работает безопасно во всех режимах: SSG, SSR, SPA; в dev/test — заглушки
 *   с логированием вместо реальной отправки.
 * @returns {{ reachGoal: (goal: string, params?: Record<string, unknown>) => void,
 *   userParams: (params: Record<string, unknown>) => void }} Методы отправки событий.
 */
export function useYandexMetrika() {
	if (!isMetricsTrackingEnabled()) {
		return {
			reachGoal: (goal: string, params: Record<string, unknown> = {}) => {
				console.info(`[YM:dev] цель '${goal}' не отправлена (dev/test-режим)`, params);
			},
			userParams: (params: Record<string, unknown>) => {
				console.info("[YM:dev] userParams не отправлены (dev/test-режим)", params);
			},
		};
	}

	/**
	 * @description Отправляет стандартное событие (цель) в Метрику.
	 * @param {string} goal Название цели в Метрике.
	 * @param {Record<string, unknown>} [params] Дополнительные параметры цели (опционально).
	 * @returns {void}
	 */
	function reachGoal(goal: string, params: Record<string, unknown> = {}): void {
		if (typeof window === "undefined" || !window.ym) {
			console.warn(`[YM] цель '${goal}' не отправлена (нет window.ym)`);
			return;
		}
		try {
			window.ym(YANDEX_METRIKA_ID, "reachGoal", goal, params);
		} catch (err) {
			console.error("[YM] ошибка при reachGoal:", err);
		}
	}

	/**
	 * @description Передаёт параметры посетителя в Метрику.
	 * @param {Record<string, unknown>} params Объект с параметрами посетителя.
	 * @returns {void}
	 */
	function userParams(params: Record<string, unknown>): void {
		if (typeof window === "undefined" || !window.ym) {
			console.warn("[YM] userParams не отправлены (нет window.ym)");
			return;
		}
		try {
			window.ym(YANDEX_METRIKA_ID, "userParams", params);
		} catch (err) {
			console.error("[YM] ошибка при userParams:", err);
		}
	}

	return { reachGoal, userParams };
}
