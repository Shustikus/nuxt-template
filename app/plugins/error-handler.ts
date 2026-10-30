/**
 * @description Глобальный перехватчик ошибок приложения Nuxt.
 * Обеспечивает обработку непредвиденных ошибок внутри интерфейса Nuxt (через error.vue),
 * предотвращая падение приложения в системные экраны браузера или необработанные исключения.
 */
import { isAbortOrCancellationError } from "~/utils/isAbortOrCancellationError";
import { isChunkLoadError } from "~/utils/isChunkLoadError";

function hasRecentlyReloaded(path?: string): boolean {
	if (typeof window === "undefined" || !path) return false;
	try {
		const raw = sessionStorage.getItem("nuxt:reload");
		if (!raw) return false;
		const handled = JSON.parse(raw) as { path?: string; expires?: number };
		return handled.path === path && typeof handled.expires === "number" && handled.expires > Date.now();
	} catch {
		return false;
	}
}

export default defineNuxtPlugin((nuxtApp) => {
	if (import.meta.client) {
		const router = useRouter();

		nuxtApp.hook("app:chunkError", () => {
			if (!hasRecentlyReloaded(window.location.pathname)) {
				reloadNuxtApp({ persistState: true });
			}
		});

		router.afterEach?.((to, from) => {
			const error = useError();
			const isUnmatchedRoute = Array.isArray(to.matched) && to.matched.length === 0;

			// Если переход совершается на существующий маршрут (например Назад или На главную) — сбрасываем старую ошибку
			if (error.value && to.fullPath !== from.fullPath && !isUnmatchedRoute) {
				void clearError();
			}

			// Маршрут не найден в Vue Router (404 на клиенте при SPA-переходе)
			if (isUnmatchedRoute && !error.value) {
				showError(
					createError({
						statusCode: 404,
						statusMessage: "Not Found",
						message: `Страница не найдена: ${to.fullPath}`,
						fatal: true,
					})
				);
			}
		});

		router.onError?.((error, to) => {
			if (isAbortOrCancellationError(error)) {
				return;
			}
			if (isChunkLoadError(error)) {
				const path =
					typeof to === "object" && to && "fullPath" in to ? String((to as { fullPath: string }).fullPath) : undefined;

				if (!hasRecentlyReloaded(path)) {
					reloadNuxtApp({ path, persistState: true });
					return;
				}
			}
			const rawStatus =
				(error as { statusCode?: number; status?: number })?.statusCode ??
				(error as { statusCode?: number; status?: number })?.status;
			const statusCode = typeof rawStatus === "number" && rawStatus >= 400 ? rawStatus : 500;
			showError(
				createError({
					statusCode,
					statusMessage: (error as { statusMessage?: string })?.statusMessage ?? "NavigationError",
					message: error.message || "Ошибка навигации",
					fatal: true,
				})
			);
		});
	}

	nuxtApp.hook("vue:error", (error) => {
		if (import.meta.client) {
			if (isAbortOrCancellationError(error)) {
				return;
			}
			if (isChunkLoadError(error)) {
				if (!hasRecentlyReloaded(window.location.pathname)) {
					reloadNuxtApp({ persistState: true });
					return;
				}
			}

			const rawStatus =
				error instanceof Error
					? ((error as { statusCode?: number; status?: number }).statusCode ??
						(error as { statusCode?: number; status?: number }).status)
					: undefined;
			const errorStatusCode = typeof rawStatus === "number" && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;

			const nuxtError = isNuxtError(error)
				? error
				: createError(
						error instanceof Error
							? {
									statusCode: errorStatusCode,
									statusMessage:
										(error as { statusMessage?: string; statusText?: string }).statusMessage ??
										(error as { statusMessage?: string; statusText?: string }).statusText ??
										(errorStatusCode === 404 ? "Not Found" : error.name || "ClientError"),
									message: error.message,
									cause: error,
								}
							: {
									statusCode: 500,
									statusMessage: "ClientError",
									message: typeof error === "string" ? error : "Непредвиденная ошибка приложения",
								}
					);

			(nuxtError as { fatal?: boolean }).fatal = true;
			(nuxtError as { unhandled?: boolean }).unhandled = true;

			// Модифицируем исходный объект ошибки, чтобы nuxt-root.vue's onErrorCaptured
			// увидел fatal: true и вернул false (подавив разрушение Suspense-дерева в Vue)
			if (error && typeof error === "object") {
				try {
					(error as { fatal?: boolean }).fatal = true;
					(error as { unhandled?: boolean }).unhandled = true;
					if (!("__nuxt_error" in error)) {
						Object.defineProperty(error, "__nuxt_error", { value: true, configurable: true, writable: true });
					}
				} catch {}
			}

			showError(nuxtError);
		}
	});
});
