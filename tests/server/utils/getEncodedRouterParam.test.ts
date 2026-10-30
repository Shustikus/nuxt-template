import { describe, expect, it, vi } from "vitest";

const { getRouterParam } = vi.hoisted(() => ({ getRouterParam: vi.fn() }));

vi.mock("h3", async (importOriginal) => ({ ...(await importOriginal<typeof import("h3")>()), getRouterParam }));

import { getEncodedRouterParam } from "../../../server/utils/getEncodedRouterParam";

describe("getEncodedRouterParam", () => {
	it("encodes a valid path segment", () => {
		getRouterParam.mockReturnValue("token ?#");
		expect(getEncodedRouterParam({} as never, "token")).toBe("token%20%3F%23");
	});

	it.each([undefined, "", "../cart", "a\\b"])("rejects unsafe value %s", (value) => {
		getRouterParam.mockReturnValue(value);
		expect(() => getEncodedRouterParam({} as never, "token")).toThrow();
	});
});
