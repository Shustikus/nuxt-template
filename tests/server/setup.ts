/** Флаг для server-тестов: Vite может вычищать `process.env.VITEST` в импортируемых модулях. */
(globalThis as { __VITEST__?: boolean }).__VITEST__ = true;
