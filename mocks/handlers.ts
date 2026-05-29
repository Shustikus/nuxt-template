import { http, HttpResponse, type RequestHandler } from "msw";

/**
 * MSW-обработчики для dev и Vitest.
 * Добавляйте маршруты по мере появления `server/api/*` и сервисов.
 */
export const handlers: RequestHandler[] = [http.get("/api/health", () => HttpResponse.json({ ok: true }))];
