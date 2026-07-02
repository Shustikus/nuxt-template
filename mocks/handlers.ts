import type { RequestHandler } from "msw";

/**
 * MSW-обработчики API для Vitest и dev (браузер).
 * См. `tests/setup.ts`, `app/plugins/msw.client.ts`.
 */
export const handlers: RequestHandler[] = [];
