/**
 * @description Копирует текст в буфер обмена (Clipboard API с fallback через textarea).
 */
export async function copyToClipboard(value: string): Promise<boolean> {
	if (import.meta.client && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return true;
		} catch {
			/* fallback ниже */
		}
	}

	if (!import.meta.client) {
		return false;
	}

	try {
		const textarea = document.createElement("textarea");
		textarea.value = value;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "fixed";
		textarea.style.left = "-9999px";
		document.body.appendChild(textarea);
		textarea.select();
		const copied = document.execCommand("copy");
		document.body.removeChild(textarea);
		return copied;
	} catch {
		return false;
	}
}
