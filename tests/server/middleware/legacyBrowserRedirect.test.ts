import type { H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendRedirectMock, getRequestURLMock, getRequestHeaderMock, appendResponseHeaderMock } = vi.hoisted(() => ({
	sendRedirectMock: vi.fn(),
	getRequestURLMock: vi.fn(),
	getRequestHeaderMock: vi.fn(),
	appendResponseHeaderMock: vi.fn(),
}));

vi.mock("h3", async (importOriginal) => {
	const actual = await importOriginal<typeof import("h3")>();
	return {
		...actual,
		sendRedirect: sendRedirectMock,
		getRequestURL: getRequestURLMock,
		getRequestHeader: getRequestHeaderMock,
		appendResponseHeader: appendResponseHeaderMock,
	};
});

const mockEvent = {} as unknown as H3Event;

describe("server/middleware/legacyBrowserRedirect", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("redirects legacy browser requesting HTML to /errors/old_browser/ with 302 and Vary header", async () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/catalog"));
		getRequestHeaderMock.mockImplementation((_event, name: string) => {
			if (name === "user-agent") return "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko"; // IE 11
			if (name === "accept") return "text/html,application/xhtml+xml";
			return undefined;
		});

		const { default: legacyBrowserMiddleware } = await import("../../../server/middleware/legacyBrowserRedirect");
		legacyBrowserMiddleware(mockEvent);

		expect(appendResponseHeaderMock).toHaveBeenCalledWith(mockEvent, "vary", "User-Agent");
		expect(sendRedirectMock).toHaveBeenCalledWith(mockEvent, "/errors/old_browser/", 302);
	});

	it("ignores modern browsers", async () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/catalog"));
		getRequestHeaderMock.mockImplementation((_event, name: string) => {
			if (name === "user-agent")
				return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
			if (name === "accept") return "text/html";
			return undefined;
		});

		const { default: legacyBrowserMiddleware } = await import("../../../server/middleware/legacyBrowserRedirect");
		const result = legacyBrowserMiddleware(mockEvent);

		expect(result).toBeUndefined();
		expect(sendRedirectMock).not.toHaveBeenCalled();
	});

	it("ignores non-html requests (e.g. assets, api calls)", async () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/api/test"));
		getRequestHeaderMock.mockImplementation((_event, name: string) => {
			if (name === "user-agent") return "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko";
			if (name === "accept") return "application/json";
			return undefined;
		});

		const { default: legacyBrowserMiddleware } = await import("../../../server/middleware/legacyBrowserRedirect");
		const result = legacyBrowserMiddleware(mockEvent);

		expect(result).toBeUndefined();
		expect(sendRedirectMock).not.toHaveBeenCalled();
	});

	it("does not redirect when already on /errors/old_browser/ or /errors/old_browser", async () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/errors/old_browser/"));
		getRequestHeaderMock.mockImplementation((_event, name: string) => {
			if (name === "user-agent") return "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko";
			if (name === "accept") return "text/html";
			return undefined;
		});

		const { default: legacyBrowserMiddleware } = await import("../../../server/middleware/legacyBrowserRedirect");
		let result = legacyBrowserMiddleware(mockEvent);
		expect(result).toBeUndefined();
		expect(sendRedirectMock).not.toHaveBeenCalled();

		getRequestURLMock.mockReturnValue(new URL("http://localhost/errors/old_browser"));
		result = legacyBrowserMiddleware(mockEvent);
		expect(result).toBeUndefined();
		expect(sendRedirectMock).not.toHaveBeenCalled();
	});
});
