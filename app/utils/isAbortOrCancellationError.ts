/**
 * Проверяет, является ли ошибка следствием прерывания сетевого запроса или отмены навигации
 * (например, при быстром клике «Назад» или размонтировании компонента).
 *
 * Такие ошибки не должны приводить к крашу приложения или показу 500/502/404 в error.vue.
 */
export function isAbortOrCancellationError(error: unknown): boolean {
	if (!error) return false;

	if (typeof error === "object") {
		const err = error as Record<string, unknown>;
		const name = String(err.name ?? "");
		const message = String(err.message ?? "");

		if (name === "AbortError" || name === "CanceledError") {
			return true;
		}

		if (
			message.includes("aborted") ||
			message.includes("cancelled") ||
			message.includes("canceled") ||
			message.includes("Navigation cancelled") ||
			message.includes("Redirected when going from") ||
			message.includes("avoided redundant navigation")
		) {
			return true;
		}

		if (err.cause && isAbortOrCancellationError(err.cause)) {
			return true;
		}

		if (err.data && isAbortOrCancellationError(err.data)) {
			return true;
		}
	}

	return false;
}
