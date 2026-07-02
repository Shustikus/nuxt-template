/**
 * Глобальный setup для Vitest.
 *
 * Запускает MSW-сервер перед всеми тестами, сбрасывает обработчики
 * после каждого теста и останавливает сервер при завершении.
 * Это позволяет тестам использовать реальные HTTP-запросы через `$fetch`,
 * которые перехватываются MSW-моками.
 */
import { beforeAll, afterEach, afterAll } from "vitest";
import type { SetupServer } from "msw/node";

const onUnhandledRequest = process.env.VITEST_MSW_UNHANDLED === "error" ? "error" : "bypass";

// Запускаем MSW-сервер; по умолчанию bypass (локально), в CI можно включить error
let server: SetupServer;

beforeAll(async () => {
	// MSW в Node пытается persist cookies в localStorage, если она доступна глобально.
	// В окружении Vitest+Node это может прокидывать Node WebStorage и давать warning про `--localstorage-file`.
	// Для unit-тестов persistence не нужна, поэтому явно убираем `localStorage` перед импортом MSW server.
	const g = globalThis as unknown as { localStorage?: unknown };
	try {
		delete g.localStorage;
	} catch {
		g.localStorage = undefined;
	}

	const serverModule = await import("../mocks/server");
	server = serverModule.server;
	server.listen({ onUnhandledRequest });
});

// Сбрасываем обработчики после каждого теста (изоляция)
afterEach(() => server?.resetHandlers());

// Останавливаем сервер после всех тестов
afterAll(() => server?.close());
