import { beforeEach, describe, expect, it, vi } from "vitest";
import { stubUseRuntimeConfig } from "../h3TestStubs";

describe("resolveRuntimeConfigString", () => {
	const envKey = "NUXT_TEST_CONFIG_VALUE";

	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
		delete process.env[envKey];
	});

	it("returns trimmed value from runtimeConfig", async () => {
		stubUseRuntimeConfig({ testKey: "  from-config  " });

		const { resolveRuntimeConfigString } = await import("../../../server/utils/resolveRuntimeConfigString");
		expect(resolveRuntimeConfigString("testKey", envKey)).toBe("from-config");
	});

	it("falls back to env when runtimeConfig is empty", async () => {
		stubUseRuntimeConfig({});
		process.env[envKey] = "  from-env  ";

		const { resolveRuntimeConfigString } = await import("../../../server/utils/resolveRuntimeConfigString");
		expect(resolveRuntimeConfigString("testKey", envKey)).toBe("from-env");
	});

	it("returns fallback when config and env are missing", async () => {
		stubUseRuntimeConfig({});

		const { resolveRuntimeConfigString } = await import("../../../server/utils/resolveRuntimeConfigString");
		expect(resolveRuntimeConfigString("testKey", envKey, "default")).toBe("default");
	});

	it("uses env when useRuntimeConfig is unavailable", async () => {
		vi.stubGlobal("useRuntimeConfig", () => {
			throw new Error("no nuxt context");
		});
		process.env[envKey] = "env-only";

		const { resolveRuntimeConfigString } = await import("../../../server/utils/resolveRuntimeConfigString");
		expect(resolveRuntimeConfigString("testKey", envKey)).toBe("env-only");
	});

	it("skips env lookup when envKey is empty", async () => {
		stubUseRuntimeConfig({});
		process.env[envKey] = "ignored";

		const { resolveRuntimeConfigString } = await import("../../../server/utils/resolveRuntimeConfigString");
		expect(resolveRuntimeConfigString("testKey", "", "default")).toBe("default");
	});

	it("ignores non-string runtimeConfig values", async () => {
		stubUseRuntimeConfig({ testKey: 42 });

		const { resolveRuntimeConfigString } = await import("../../../server/utils/resolveRuntimeConfigString");
		expect(resolveRuntimeConfigString("testKey", envKey, "default")).toBe("default");
	});
});
