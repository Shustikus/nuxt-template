import type { H3Event } from "h3";
import { buildBackendApiUrl } from "~/config/api";
import { forwardBackendError, getServerFetch, toProxyRequestBody } from "./proxyBackendShared";

interface ProxyBackendPostOptions<TBody> {
	event: H3Event;
	path: string;
	body: TBody;
}

/** Проксирует POST и сохраняет backend error response без преобразований. */
export async function proxyBackendPost<TBody, TResponse>({
	event,
	path,
	body,
}: ProxyBackendPostOptions<TBody>): Promise<TResponse> {
	try {
		return (await getServerFetch()(buildBackendApiUrl(path), {
			method: "POST",
			body: toProxyRequestBody(body),
		})) as TResponse;
	} catch (error) {
		return forwardBackendError(event, error);
	}
}
