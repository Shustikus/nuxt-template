import { isVitest } from "./isVitest";

/**
 * @description Определяет, включён ли трекинг внешних метрик (Яндекс.Метрика, Roistat,
 *   Top.Mail.Ru, Diginetica). Счётчики подключаются только в production-сборке:
 *   в dev localhost-трафик засоряет статистику, в тестах window.ym недоступен.
 * @returns {boolean} `true` — трекинг включён (production вне тестов).
 */
export function isMetricsTrackingEnabled(): boolean {
	return !import.meta.dev && !isVitest();
}
