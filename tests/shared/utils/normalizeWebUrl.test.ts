import { describe, expect, it } from "vitest";
import { normalizeWebUrl } from "~/shared/utils/normalizeWebUrl";

describe("normalizeWebUrl", () => {
	it.each([
		[" /media/articles/news/ ", "/media/articles/news/"],
		["https://example.com/video/example/", "https://example.com/video/example/"],
	])("normalizes a supported web URL", (value, expected) => {
		expect(normalizeWebUrl(value)).toBe(expected);
	});

	it.each(["", "javascript:alert(1)", "data:text/html,test", "//example.com", "article"])(
		"rejects an unsafe or ambiguous web URL: %s",
		(value) => {
			expect(() => normalizeWebUrl(value)).toThrow(TypeError);
		}
	);

	it("can root a relative URL explicitly", () => {
		expect(normalizeWebUrl("upload/image.png", { relative: "root" })).toBe("/upload/image.png");
	});

	it.each(["//example.com/image.png", "https://", "custom:value"])(
		"does not convert an invalid or unsupported absolute URL to a relative one: %s",
		(value) => {
			expect(() => normalizeWebUrl(value, { relative: "root" })).toThrow(TypeError);
		}
	);
});
