import type { H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import redirectsMiddleware from "../../../server/middleware/redirects";

const { sendRedirectMock, getRequestURLMock } = vi.hoisted(() => ({
	sendRedirectMock: vi.fn(),
	getRequestURLMock: vi.fn(),
}));

vi.mock("h3", async (importOriginal) => {
	const actual = await importOriginal<typeof import("h3")>();
	return { ...actual, sendRedirect: sendRedirectMock, getRequestURL: getRequestURLMock };
});

const mockEvent = {} as unknown as H3Event;

describe("server/middleware/redirects", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("отдаёт 301-редирект с /site.webmanifest на /favicon/site.webmanifest", () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/site.webmanifest"));

		redirectsMiddleware(mockEvent);

		expect(sendRedirectMock).toHaveBeenCalledWith(mockEvent, "/favicon/site.webmanifest", 301);
	});

	it("сохраняет query-параметры при редиректе", () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/site.webmanifest?v=2"));

		redirectsMiddleware(mockEvent);

		expect(sendRedirectMock).toHaveBeenCalledWith(mockEvent, "/favicon/site.webmanifest?v=2", 301);
	});

	it("не перенаправляет целевые адреса", () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/favicon/site.webmanifest"));

		const result = redirectsMiddleware(mockEvent);

		expect(result).toBeUndefined();
		expect(sendRedirectMock).not.toHaveBeenCalled();
	});

	it("не перенаправляет обычные адреса", () => {
		getRequestURLMock.mockReturnValue(new URL("http://localhost/"));

		const result = redirectsMiddleware(mockEvent);

		expect(result).toBeUndefined();
		expect(sendRedirectMock).not.toHaveBeenCalled();
	});
});
