import { buildBackendApiUrl } from "~/config/api";
import { isVitest } from "~/utils/isVitest";
import { getServerFetch } from "./getServerFetch";

interface ProxyBackendPostOptions<TBody, TResponse> {
	path: string;
	body: TBody;
	mock: TResponse | ((body: TBody) => TResponse);
	errorMessage: string;
}

/** Проксирует POST на бэкенд; в Vitest при ошибке возвращает mock. */
export async function proxyBackendPost<TBody, TResponse>({
	path,
	body,
	mock,
	errorMessage,
}: ProxyBackendPostOptions<TBody, TResponse>): Promise<TResponse> {
	try {
		return (await getServerFetch()(buildBackendApiUrl(path), { method: "POST", body })) as TResponse;
	} catch (error) {
		if (isVitest()) {
			if (typeof mock === "function") {
				return (mock as (body: TBody) => TResponse)(body);
			}

			return mock;
		}

		throw createError({ statusCode: 502, message: errorMessage, cause: error });
	}
}
