/**
 * Клиентский Nuxt-плагин для MSW (Mock Service Worker).
 *
 * В dev-режиме регистрирует Service Worker, который перехватывает
 * все HTTP-запросы к API и возвращает мок-данные из `mocks/handlers.ts`.
 * В production-сборке плагин не выполняется.
 */
export default defineNuxtPlugin(async () => {
	if (import.meta.dev) {
		const { worker } = await import("../../mocks/browser");
		await worker.start({
			onUnhandledRequest: "bypass", // Не перехватывать запросы без обработчика
		});
	}
});
