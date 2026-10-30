import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteLocationNormalized } from "vue-router";

const { navigateToMock } = vi.hoisted(() => {
	(globalThis as unknown as Record<string, unknown>).defineNuxtRouteMiddleware = (handler: unknown) => handler;
	return { navigateToMock: vi.fn() };
});

vi.stubGlobal("navigateTo", navigateToMock);

import redirectsGlobal from "../../app/middleware/redirects.global";

function mockRoute(path: string, query: Record<string, string> = {}, hash = ""): RouteLocationNormalized {
	return {
		path,
		query,
		hash,
		fullPath: path,
		name: "test",
		params: {},
		matched: [],
		meta: {},
		redirectedFrom: undefined,
	};
}

describe("app/middleware/redirects.global", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("выполняет 301 navigateTo при переходе на /site.webmanifest", () => {
		redirectsGlobal(mockRoute("/site.webmanifest"));

		expect(navigateToMock).toHaveBeenCalledWith(
			{ path: "/favicon/site.webmanifest", query: {}, hash: "" },
			{ redirectCode: 301, external: false }
		);
	});

	it("сохраняет query и hash при SPA-переходе", () => {
		redirectsGlobal(mockRoute("/site.webmanifest", { v: "2" }, "#top"));

		expect(navigateToMock).toHaveBeenCalledWith(
			{ path: "/favicon/site.webmanifest", query: { v: "2" }, hash: "#top" },
			{ redirectCode: 301, external: false }
		);
	});

	it("не выполняет navigateTo для обычных путей", () => {
		redirectsGlobal(mockRoute("/"));

		expect(navigateToMock).not.toHaveBeenCalled();
	});
});
