import { describe, expect, it } from "vitest";
import { isAbortOrCancellationError } from "~/utils/isAbortOrCancellationError";

describe("isAbortOrCancellationError", () => {
	it("возвращает false для null, undefined, примитивов и обычных ошибок", () => {
		expect(isAbortOrCancellationError(null)).toBe(false);
		expect(isAbortOrCancellationError(undefined)).toBe(false);
		expect(isAbortOrCancellationError("")).toBe(false);
		expect(isAbortOrCancellationError(404)).toBe(false);
		expect(isAbortOrCancellationError(new Error("Normal error"))).toBe(false);
		expect(isAbortOrCancellationError({ statusCode: 500, message: "Server error" })).toBe(false);
	});

	it("распознаёт AbortError по имени", () => {
		const error = new Error("The user aborted a request.");
		error.name = "AbortError";
		expect(isAbortOrCancellationError(error)).toBe(true);
	});

	it("распознаёт CanceledError по имени", () => {
		const error = { name: "CanceledError", message: "canceled" };
		expect(isAbortOrCancellationError(error)).toBe(true);
	});

	it("распознаёт сообщения об отмене навигации vue-router", () => {
		expect(
			isAbortOrCancellationError(
				new Error('Navigation cancelled from "/products" to "/products/section" with a new navigation.')
			)
		).toBe(true);
		expect(
			isAbortOrCancellationError(
				new Error('Redirected when going from "/products" to "/login" via a navigation guard.')
			)
		).toBe(true);
		expect(isAbortOrCancellationError(new Error("avoided redundant navigation to current location"))).toBe(true);
	});

	it("распознаёт сообщения отмены Nuxt unmount", () => {
		expect(isAbortOrCancellationError(new Error("fetch was cancelled by unmount of the component"))).toBe(true);
	});

	it("распознаёт вложенные ошибки в cause или data", () => {
		const rootError = { message: "Failed to fetch", cause: { name: "AbortError", message: "aborted" } };
		expect(isAbortOrCancellationError(rootError)).toBe(true);

		const dataError = { message: "Internal error", data: { name: "CanceledError" } };
		expect(isAbortOrCancellationError(dataError)).toBe(true);
	});
});
