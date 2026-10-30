import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubDefineEventHandler, stubSetResponseStatus } from "../h3TestStubs";

describe("POST /api/csp-report", () => {
	beforeEach(() => {
		vi.unstubAllGlobals();
		stubDefineEventHandler();
		stubSetResponseStatus();
	});

	it("возвращает 204 No Content", async () => {
		const setStatus = vi.fn();
		vi.stubGlobal("setResponseStatus", setStatus);

		const handlerModule = await import("../../../server/api/csp-report.post");
		const handler = handlerModule.default as (event: unknown) => unknown;

		const event = {};
		const result = handler(event);

		expect(setStatus).toHaveBeenCalledWith(event, 204);
		expect(result).toBeNull();
	});
});
