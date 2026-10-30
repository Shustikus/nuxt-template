/**
 * Проверяет, является ли ошибка следствием устаревания или сбоя загрузки JS/CSS чанков
 * (например, после деплоя новой версии фронтенда, когда старые хеши чанков удалены с сервера).
 *
 * При обнаружении такой ошибки приложение должно выполнить бесшовную перезагрузку (reloadNuxtApp)
 * вместо показа фатального экрана ошибки 500.
 */
export function isChunkLoadError(error: unknown): boolean {
	if (!error) return false;

	if (typeof error === "object") {
		const err = error as Record<string, unknown>;
		const name = String(err.name ?? "");
		const message = String(err.message ?? "");

		if (name === "ChunkLoadError") {
			return true;
		}

		if (
			/failed to (fetch|load) dynamically imported module/i.test(message) ||
			/error loading dynamically imported module/i.test(message) ||
			/importing a module script failed/i.test(message) ||
			/loading chunk [^\s]+ failed/i.test(message) ||
			/loading css chunk [^\s]+ failed/i.test(message) ||
			/unable to preload css/i.test(message)
		) {
			return true;
		}

		if (err.cause && isChunkLoadError(err.cause)) {
			return true;
		}

		if (err.data && isChunkLoadError(err.data)) {
			return true;
		}
	} else if (typeof error === "string") {
		return (
			/failed to (fetch|load) dynamically imported module/i.test(error) ||
			/error loading dynamically imported module/i.test(error) ||
			/importing a module script failed/i.test(error) ||
			/loading chunk [^\s]+ failed/i.test(error) ||
			/loading css chunk [^\s]+ failed/i.test(error) ||
			/unable to preload css/i.test(error)
		);
	}

	return false;
}
