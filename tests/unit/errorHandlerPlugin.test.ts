import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("defineNuxtPlugin", (plugin: unknown) => plugin);
const { default: errorHandlerPlugin } = await import("~/plugins/error-handler");

describe("error-handler plugin", () => {
	let afterEachCallback: ((to: { fullPath: string }, from: { fullPath: string }) => void) | undefined;
	let vueErrorCallback: ((error: unknown) => void) | undefined;
	let capturedErrorRef: { value: unknown };
	let shownError: Record<string, unknown> | undefined;
	let routerOnErrorCallback: ((error: unknown, to?: { fullPath: string }) => void) | undefined;
	let reloadNuxtAppArgs: Record<string, unknown> | undefined;

	beforeEach(() => {
		afterEachCallback = undefined;
		vueErrorCallback = undefined;
		routerOnErrorCallback = undefined;
		reloadNuxtAppArgs = undefined;
		capturedErrorRef = { value: undefined };
		shownError = undefined;
		vi.stubGlobal("reloadNuxtApp", (options?: Record<string, unknown>) => {
			reloadNuxtAppArgs = options;
		});

		vi.stubGlobal("useRouter", () => ({
			afterEach: (cb: (to: { fullPath: string }, from: { fullPath: string }) => void) => {
				afterEachCallback = cb;
			},
			onError: (cb: (error: unknown, to?: { fullPath: string }) => void) => {
				routerOnErrorCallback = cb;
			},
		}));

		vi.stubGlobal("useError", () => capturedErrorRef);
		vi.stubGlobal("clearError", () => {
			capturedErrorRef.value = undefined;
			return Promise.resolve();
		});
		vi.stubGlobal("showError", (err: Record<string, unknown>) => {
			shownError = err;
		});
		vi.stubGlobal("createError", (err: Record<string, unknown>) => {
			const e = new Error(String(err.message ?? ""));
			Object.assign(e, err);
			return e;
		});
		vi.stubGlobal("isNuxtError", () => false);
	});

	it("сбрасывает ошибку в router.afterEach при переходе на другой маршрут (например по кнопке Назад)", () => {
		const mockNuxtApp = {
			hook: (name: string, cb: (err: unknown) => void) => {
				if (name === "vue:error") vueErrorCallback = cb;
			},
		};

		errorHandlerPlugin(mockNuxtApp as never);

		expect(afterEachCallback).toBeDefined();

		// Имитируем активную ошибку
		capturedErrorRef.value = { statusCode: 404 };

		// Переход на тот же маршрут не сбрасывает ошибку
		afterEachCallback!({ fullPath: "/articles/test-item" }, { fullPath: "/articles/test-item" });
		expect(capturedErrorRef.value).toBeDefined();

		// Переход назад на другой маршрут сбрасывает ошибку
		afterEachCallback!({ fullPath: "/articles" }, { fullPath: "/articles/test-item" });
		expect(capturedErrorRef.value).toBeUndefined();
	});

	it("сохраняет statusCode: 404 для ошибок с заданным статусом", () => {
		const mockNuxtApp = {
			hook: (name: string, cb: (err: unknown) => void) => {
				if (name === "vue:error") vueErrorCallback = cb;
			},
		};

		errorHandlerPlugin(mockNuxtApp as never);

		const customError = new Error("Resource not found");
		Object.assign(customError, { statusCode: 404, statusMessage: "Not Found" });

		vueErrorCallback!(customError);

		expect(shownError).toBeDefined();
		expect(shownError?.statusCode).toBe(404);
		expect(shownError?.statusMessage).toBe("Not Found");
		expect(shownError?.message).toBe("Resource not found");
	});

	it("ставит statusCode: 500 для стандартных ошибок без указания statusCode", () => {
		const mockNuxtApp = {
			hook: (name: string, cb: (err: unknown) => void) => {
				if (name === "vue:error") vueErrorCallback = cb;
			},
		};

		errorHandlerPlugin(mockNuxtApp as never);

		const regularError = new Error("Unexpected failure");
		vueErrorCallback!(regularError);

		expect(shownError).toBeDefined();
		expect(shownError?.statusCode).toBe(500);
		expect(shownError?.statusMessage).toBe("Error");
		expect(shownError?.message).toBe("Unexpected failure");
	});

	it("принудительно устанавливает fatal: true для нефатальных NuxtError в vue:error, чтобы отобразить экран ошибки", () => {
		vi.stubGlobal("isNuxtError", () => true);

		const mockNuxtApp = {
			hook: (name: string, cb: (err: unknown) => void) => {
				if (name === "vue:error") vueErrorCallback = cb;
			},
		};

		errorHandlerPlugin(mockNuxtApp as never);

		const nonFatalError = { statusCode: 404, statusMessage: "Not Found", fatal: false, message: "Not found" };

		vueErrorCallback!(nonFatalError);

		expect(shownError).toBeDefined();
		expect(shownError?.statusCode).toBe(404);
		expect(shownError?.fatal).toBe(true);
	});

	it("вызывает showError с кодом 404 при переходе на несопоставленный маршрут (to.matched = [])", () => {
		let capturedAfterEach:
			((to: { fullPath: string; matched: unknown[] }, from: { fullPath: string }) => void) | undefined;

		vi.stubGlobal("useRouter", () => ({
			afterEach: (cb: (to: { fullPath: string; matched: unknown[] }, from: { fullPath: string }) => void) => {
				capturedAfterEach = cb;
			},
		}));

		const mockNuxtApp = { hook: vi.fn() };

		errorHandlerPlugin(mockNuxtApp as never);

		expect(capturedAfterEach).toBeDefined();

		capturedAfterEach!({ fullPath: "/nonexistent-page", matched: [] }, { fullPath: "/" });

		expect(shownError).toBeDefined();
		expect(shownError?.statusCode).toBe(404);
		expect(shownError?.statusMessage).toBe("Not Found");
		expect(shownError?.fatal).toBe(true);
	});

	it("вызывает reloadNuxtApp вместо показа ошибки 500 при сбое загрузки чанка в router.onError", () => {
		const mockNuxtApp = { hook: vi.fn() };

		errorHandlerPlugin(mockNuxtApp as never);

		expect(routerOnErrorCallback).toBeDefined();

		const chunkError = new TypeError(
			"Failed to fetch dynamically imported module: https://example.com/_nuxt/page.123.js"
		);

		routerOnErrorCallback!(chunkError, { fullPath: "/catalog/sensors" });

		expect(shownError).toBeUndefined();
		expect(reloadNuxtAppArgs).toEqual({ path: "/catalog/sensors", persistState: true });
	});

	it("вызывает reloadNuxtApp при сбое загрузки чанка в vue:error", () => {
		const mockNuxtApp = {
			hook: (name: string, cb: (err: unknown) => void) => {
				if (name === "vue:error") vueErrorCallback = cb;
			},
		};

		errorHandlerPlugin(mockNuxtApp as never);

		expect(vueErrorCallback).toBeDefined();

		const chunkError = new Error("Loading chunk 42 failed.");
		vueErrorCallback!(chunkError);

		expect(shownError).toBeUndefined();
		expect(reloadNuxtAppArgs).toEqual({ persistState: true });
	});

	it("вызывает reloadNuxtApp при наступлении хука app:chunkError", () => {
		let chunkErrorHook: (() => void) | undefined;
		const mockNuxtApp = {
			hook: (name: string, cb: () => void) => {
				if (name === "app:chunkError") chunkErrorHook = cb;
			},
		};

		errorHandlerPlugin(mockNuxtApp as never);

		expect(chunkErrorHook).toBeDefined();
		chunkErrorHook!();

		expect(reloadNuxtAppArgs).toEqual({ persistState: true });
	});

	it("показывает ошибку вместо повторного reloadNuxtApp, если перезагрузка для этого пути уже недавно выполнялась", () => {
		const mockNuxtApp = { hook: vi.fn() };

		sessionStorage.setItem("nuxt:reload", JSON.stringify({ path: "/catalog/sensors", expires: Date.now() + 10000 }));

		errorHandlerPlugin(mockNuxtApp as never);

		const chunkError = new TypeError(
			"Failed to fetch dynamically imported module: https://example.com/_nuxt/page.123.js"
		);

		routerOnErrorCallback!(chunkError, { fullPath: "/catalog/sensors" });

		expect(reloadNuxtAppArgs).toBeUndefined();
		expect(shownError).toBeDefined();
		expect(shownError?.statusCode).toBe(500);

		sessionStorage.removeItem("nuxt:reload");
	});

	it("показывает ошибку вместо повторного reloadNuxtApp в vue:error, если перезагрузка уже недавно выполнялась", () => {
		const mockNuxtApp = {
			hook: (name: string, cb: (err: unknown) => void) => {
				if (name === "vue:error") vueErrorCallback = cb;
			},
		};

		sessionStorage.setItem(
			"nuxt:reload",
			JSON.stringify({ path: window.location.pathname, expires: Date.now() + 10000 })
		);

		errorHandlerPlugin(mockNuxtApp as never);

		const chunkError = new Error("Loading chunk 42 failed.");
		vueErrorCallback!(chunkError);

		expect(reloadNuxtAppArgs).toBeUndefined();
		expect(shownError).toBeDefined();
		expect(shownError?.statusCode).toBe(500);

		sessionStorage.removeItem("nuxt:reload");
	});
});
