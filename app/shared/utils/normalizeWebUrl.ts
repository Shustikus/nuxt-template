const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export type RelativeWebUrlMode = "reject" | "root";

export interface NormalizeWebUrlOptions {
	relative?: RelativeWebUrlMode;
}

export function normalizeWebUrl(value: string, options: NormalizeWebUrlOptions = {}): string {
	const normalizedValue = value.trim();

	if (!normalizedValue) {
		throw new TypeError("Web URL must not be empty");
	}

	if (normalizedValue.startsWith("/") && !normalizedValue.startsWith("//")) {
		return normalizedValue;
	}

	if (normalizedValue.startsWith("//")) {
		throw new TypeError(`Protocol-relative web URL is not supported: ${normalizedValue}`);
	}

	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalizedValue);
	} catch {
		if (options.relative === "root" && !URL_SCHEME_PATTERN.test(normalizedValue)) {
			return `/${normalizedValue}`;
		}

		throw new TypeError(`Invalid web URL: ${normalizedValue}`);
	}

	if (!HTTP_PROTOCOLS.has(parsedUrl.protocol)) {
		throw new TypeError(`Unsupported web URL protocol: ${parsedUrl.protocol}`);
	}

	return parsedUrl.href;
}
