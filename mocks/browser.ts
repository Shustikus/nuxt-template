import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * MSW Service Worker для перехвата запросов в браузере.
 * Подключается через `app/plugins/msw.client.ts` только в dev-режиме.
 */
export const worker = setupWorker(...handlers);
