import type { H3Event } from "h3";
import { buildBackendApiUrl } from "~/config/api";
import { forwardBackendError, getBackendRetryOptions, getServerFetch } from "./proxyBackendShared";

interface ProxyBackendGetOptions {
	event: H3Event;
	path: string;
}

/** Проксирует GET и сохраняет backend error response без преобразований. */
export async function proxyBackendGet<T>({ event, path }: ProxyBackendGetOptions): Promise<T> {
	const retryOpts = getBackendRetryOptions(true);
	try {
		return (await (retryOpts
			? getServerFetch()(buildBackendApiUrl(path), retryOpts)
			: getServerFetch()(buildBackendApiUrl(path)))) as T;
	} catch (error) {
		return forwardBackendError(event, error);
	}
}
