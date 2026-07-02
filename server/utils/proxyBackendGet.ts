import { buildBackendApiUrl } from "~/config/api";
import { isVitest } from "~/utils/isVitest";
import { getServerFetch } from "./getServerFetch";

interface ProxyBackendGetOptions<T> {
	path: string;
	mock: T;
	errorMessage: string;
}

/** Проксирует GET на бэкенд; в Vitest при ошибке возвращает mock. */
export async function proxyBackendGet<T>({ path, mock, errorMessage }: ProxyBackendGetOptions<T>): Promise<T> {
	try {
		return (await getServerFetch()(buildBackendApiUrl(path))) as T;
	} catch (error) {
		if (isVitest()) return mock;

		throw createError({ statusCode: 502, message: errorMessage, cause: error });
	}
}
