// @vitest-environment nuxt
import { describe, it, expect } from "vitest";
import { useRouter, useError, clearError } from "#app";
import { nextTick } from "vue";

describe("Client navigation error handling", () => {
	it("navigates to unmatched route and triggers 404 error without getting stuck on old screen", async () => {
		const router = useRouter();
		const error = useError();

		await router.push("/nonexistent-test-page-404");
		await nextTick();

		expect(router.currentRoute.value.path).toBe("/nonexistent-test-page-404");
		expect(error.value).toBeDefined();
		expect(error.value?.statusCode).toBe(404);

		await clearError();
	});
});
