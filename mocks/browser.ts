import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * MSW worker для браузера.
 * Подключается в dev через `app/plugins/msw.client.ts`.
 */
export const worker = setupWorker(...handlers);
