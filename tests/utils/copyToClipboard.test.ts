import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "~/utils/copyToClipboard";

describe("copyToClipboard", () => {
	const originalClipboard = navigator.clipboard;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		Object.defineProperty(navigator, "clipboard", { value: originalClipboard, writable: true, configurable: true });
	});

	it("копирует через navigator.clipboard.writeText", async () => {
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextMock },
			writable: true,
			configurable: true,
		});

		const result = await copyToClipboard("test text");
		expect(result).toBe(true);
		expect(writeTextMock).toHaveBeenCalledWith("test text");
	});

	it("использует fallback через textarea, если navigator.clipboard.writeText падает", async () => {
		const writeTextMock = vi.fn().mockRejectedValue(new Error("Permission denied"));
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextMock },
			writable: true,
			configurable: true,
		});

		const execCommandMock = vi.fn().mockReturnValue(true);
		document.execCommand = execCommandMock;

		const result = await copyToClipboard("fallback text");
		expect(result).toBe(true);
		expect(execCommandMock).toHaveBeenCalledWith("copy");
	});

	it("использует fallback через textarea, если navigator.clipboard отсутствует", async () => {
		Object.defineProperty(navigator, "clipboard", { value: undefined, writable: true, configurable: true });

		const execCommandMock = vi.fn().mockReturnValue(true);
		document.execCommand = execCommandMock;

		const result = await copyToClipboard("no-clipboard text");
		expect(result).toBe(true);
		expect(execCommandMock).toHaveBeenCalledWith("copy");
	});

	it("возвращает false, если execCommand выбросил ошибку", async () => {
		Object.defineProperty(navigator, "clipboard", { value: undefined, writable: true, configurable: true });

		document.execCommand = vi.fn().mockImplementation(() => {
			throw new Error("ExecCommand failed");
		});

		const result = await copyToClipboard("fail text");
		expect(result).toBe(false);
	});
});
