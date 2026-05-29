import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW-сервер для перехвата запросов в Node.js (тесты).
 * Подключается в `tests/setup.ts` через beforeAll/afterAll.
 */
export const server = setupServer(...handlers);
