import { brotliDecompressSync, gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";

type FakeHeaders = Record<string, string | number | string[] | undefined>;

interface FakeEvent {
	path?: string;
	node: {
		req: { method: string; headers: Record<string, string> };
		res: {
			statusCode: number;
			headers: FakeHeaders;
			getHeader: (name: string) => unknown;
			setHeader: (name: string, value: string) => void;
			removeHeader: (name: string) => void;
		};
	};
}

function createFakeEvent(headers: Record<string, string> = {}, path = "/"): FakeEvent {
	const normalized = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
	const resHeaders: FakeHeaders = {};
	return {
		path,
		node: {
			req: { method: "GET", headers: normalized },
			res: {
				statusCode: 200,
				headers: resHeaders,
				getHeader: (name: string) => resHeaders[name.toLowerCase()],
				setHeader: (name: string, value: string) => {
					resHeaders[name.toLowerCase()] = value;
				},
				removeHeader: (name: string) => {
					delete resHeaders[name.toLowerCase()];
				},
			},
		},
	};
}

type BeforeResponseHook = (event: FakeEvent, response: { body?: unknown }) => void | Promise<void>;

async function loadHook(): Promise<BeforeResponseHook> {
	let captured: BeforeResponseHook | undefined;

	const nitroApp = {
		hooks: {
			hook: (name: string, handler: BeforeResponseHook) => {
				if (name === "beforeResponse") captured = handler;
			},
		},
	};

	const { default: plugin } = await import("../../../server/plugins/compressResponses");
	plugin(nitroApp as Parameters<typeof plugin>[0]);

	if (!captured) throw new Error("beforeResponse hook was not registered");
	return captured;
}

const LARGE_HTML = `<html><body>${"x".repeat(4096)}</body></html>`;

describe("server/plugins/compressResponses", () => {
	it("сжимает brotli HTML-ответ при accept-encoding: br", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip, deflate, br, zstd" });
		const response = { body: LARGE_HTML };

		await hook(event, response);

		const body = response.body as Buffer;
		expect(Buffer.isBuffer(body)).toBe(true);
		expect(event.node.res.headers["content-encoding"]).toBe("br");
		expect(event.node.res.headers.vary).toContain("Accept-Encoding");
		expect(event.node.res.headers["content-type"]).toContain("text/html");
		expect(brotliDecompressSync(body).toString("utf8")).toBe(LARGE_HTML);
	});

	it("сжимает gzip, если brotli не поддерживается", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip, deflate" });
		const response = { body: LARGE_HTML };

		await hook(event, response);

		expect(event.node.res.headers["content-encoding"]).toBe("gzip");
		expect(gunzipSync(response.body as Buffer).toString("utf8")).toBe(LARGE_HTML);
	});

	it("не сжимает внутренние вызовы без accept-encoding (SSR $fetch, prerender)", async () => {
		const hook = await loadHook();
		const event = createFakeEvent();
		const response = { body: LARGE_HTML };

		await hook(event, response);

		expect(response.body).toBe(LARGE_HTML);
		expect(event.node.res.headers["content-encoding"]).toBeUndefined();
	});

	it("не сжимает рендер ошибки Nitro (/__nuxt_error) даже при accept-encoding: br", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip, deflate, br" }, "/__nuxt_error");
		const response = { body: LARGE_HTML };

		await hook(event, response);

		expect(response.body).toBe(LARGE_HTML);
		expect(event.node.res.headers["content-encoding"]).toBeUndefined();
	});

	it("не сжимает запрос с заголовком x-nuxt-error даже при accept-encoding: br", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip, deflate, br", "x-nuxt-error": "true" });
		const response = { body: LARGE_HTML };

		await hook(event, response);

		expect(response.body).toBe(LARGE_HTML);
		expect(event.node.res.headers["content-encoding"]).toBeUndefined();
	});

	it("не сжимает запрос с заголовком x-nitro-prerender", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip, deflate, br", "x-nitro-prerender": "1" });
		const response = { body: LARGE_HTML };

		await hook(event, response);

		expect(response.body).toBe(LARGE_HTML);
		expect(event.node.res.headers["content-encoding"]).toBeUndefined();
	});

	it("сжимает JSON-объекты и выставляет content-type", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip" });
		const payload = { items: Array.from({ length: 256 }, (_, i) => ({ id: i })) };
		const response = { body: payload };

		await hook(event, response);

		const body = response.body as Buffer;
		expect(Buffer.isBuffer(body)).toBe(true);
		expect(event.node.res.headers["content-type"]).toBe("application/json");
		expect(JSON.parse(gunzipSync(body).toString("utf8"))).toEqual(payload);
	});

	it("не трогает тела меньше порога", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip" });
		const response = { body: "tiny" };

		await hook(event, response);

		expect(response.body).toBe("tiny");
		expect(event.node.res.headers["content-encoding"]).toBeUndefined();
	});

	it("пропускает ответы с уже выставленным content-encoding", async () => {
		const hook = await loadHook();
		const event = createFakeEvent({ "accept-encoding": "gzip" });
		event.node.res.setHeader("content-encoding", "br");
		const response = { body: LARGE_HTML };

		await hook(event, response);

		expect(response.body).toBe(LARGE_HTML);
		expect(event.node.res.headers["content-encoding"]).toBe("br");
	});

	it("пропускает HEAD и ответы без тела (204/304)", async () => {
		const hook = await loadHook();

		const headEvent = createFakeEvent({ "accept-encoding": "gzip" });
		headEvent.node.req.method = "HEAD";
		await hook(headEvent, { body: LARGE_HTML });
		expect(headEvent.node.res.headers["content-encoding"]).toBeUndefined();

		const noContent = createFakeEvent({ "accept-encoding": "gzip" });
		noContent.node.res.statusCode = 304;
		await hook(noContent, { body: LARGE_HTML });
		expect(noContent.node.res.headers["content-encoding"]).toBeUndefined();
	});

	it("пропускает стримы и Web Response", async () => {
		const hook = await loadHook();

		const streamEvent = createFakeEvent({ "accept-encoding": "gzip" });
		const fakeStream = { pipe: () => {}, on: () => {} };
		const streamResponse = { body: fakeStream };
		await hook(streamEvent, streamResponse);
		expect(streamResponse.body).toBe(fakeStream);

		const webResponseEvent = createFakeEvent({ "accept-encoding": "gzip" });
		const webResponse = new Response(LARGE_HTML);
		const webBody = { body: webResponse };
		await hook(webResponseEvent, webBody);
		expect(webBody.body).toBe(webResponse);
	});
});
