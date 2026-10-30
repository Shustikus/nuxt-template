#!/usr/bin/env node
/**
 * Runtime Web Vitals measurement against a running Nuxt production server.
 *
 * Usage:
 *   node scripts/measure-web-vitals.mjs [baseUrl]
 *
 * Env:
 *   PERF_BASE_URL — default http://127.0.0.1:3000
 *   PERF_RUNS — cold runs per URL (default 3)
 */
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const baseUrl = (process.argv[2] || process.env.PERF_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const runs = Math.max(1, Number(process.env.PERF_RUNS || 3));

const paths = process.env.PERF_PATHS
	? process.env.PERF_PATHS.split(",")
			.map((p) => p.trim())
			.filter(Boolean)
	: ["/"];

const VIEWPORT = { width: 1366, height: 768 };

function median(values) {
	const sorted = [...values].filter((v) => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
	if (!sorted.length) return null;
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(value, digits = 1) {
	if (value == null || !Number.isFinite(value)) return null;
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function kib(bytes) {
	if (bytes == null || !Number.isFinite(bytes)) return null;
	return round(bytes / 1024, 1);
}

async function measureOnce(browser, path) {
	const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
	const page = await context.newPage();

	const backendHosts = new Set();
	const resourceSizes = { js: 0, css: 0, document: 0, other: 0 };
	let backendRequestCount = 0;
	let documentTtfbMs = null;
	let documentEncodedBytes = null;
	let payloadBytes = 0;

	page.on("response", async (response) => {
		try {
			const url = response.url();
			const request = response.request();
			const resourceType = request.resourceType();
			const headers = response.headers();
			const encoded = Number(headers["content-length"]);
			const size = Number.isFinite(encoded) ? encoded : 0;

			if (resourceType === "document" && new URL(url).pathname === path) {
				const timing = response.request().timing();
				documentTtfbMs = timing.responseStart;
				documentEncodedBytes = size || null;
				resourceSizes.document += size;
			} else if (resourceType === "script") {
				resourceSizes.js += size;
			} else if (resourceType === "stylesheet") {
				resourceSizes.css += size;
			} else {
				resourceSizes.other += size;
			}

			if (url.includes("/_payload.json") || url.includes("_payload")) {
				payloadBytes += size;
			}

			// Backend proxy requests usually under /api/
			if (url.includes("/api/")) {
				if (!url.includes("/_nuxt/") && resourceType !== "document") {
					backendRequestCount += 1;
					try {
						backendHosts.add(new URL(url).host);
					} catch {
						/* ignore */
					}
				}
			}
		} catch {
			/* ignore detached responses */
		}
	});

	await page.addInitScript(() => {
		window.__perfMetrics = { lcp: null, cls: 0, inp: null, fcp: null, longTasks: [], hydrationMs: null };

		try {
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === "largest-contentful-paint") {
						window.__perfMetrics.lcp = entry.startTime;
					}
					if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
						window.__perfMetrics.fcp = entry.startTime;
					}
					if (entry.entryType === "layout-shift" && !entry.hadRecentInput) {
						window.__perfMetrics.cls += entry.value;
					}
					if (entry.entryType === "event" && entry.interactionId) {
						const duration = entry.duration ?? entry.processingEnd - entry.startTime;
						if (window.__perfMetrics.inp == null || duration > window.__perfMetrics.inp) {
							window.__perfMetrics.inp = duration;
						}
					}
					if (entry.entryType === "longtask") {
						window.__perfMetrics.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
					}
				}
			}).observe({ type: "largest-contentful-paint", buffered: true });
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.name === "first-contentful-paint") {
						window.__perfMetrics.fcp = entry.startTime;
					}
				}
			}).observe({ type: "paint", buffered: true });
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (!entry.hadRecentInput) window.__perfMetrics.cls += entry.value;
				}
			}).observe({ type: "layout-shift", buffered: true });
			try {
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						if (!entry.interactionId) continue;
						const duration = entry.duration ?? entry.processingEnd - entry.startTime;
						if (window.__perfMetrics.inp == null || duration > window.__perfMetrics.inp) {
							window.__perfMetrics.inp = duration;
						}
					}
				}).observe({ type: "event", buffered: true, durationThreshold: 16 });
			} catch {
				/* Event Timing may be unavailable */
			}
			try {
				new PerformanceObserver((list) => {
					for (const entry of list.getEntries()) {
						window.__perfMetrics.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
					}
				}).observe({ type: "longtask", buffered: true });
			} catch {
				/* Long Tasks may be unavailable */
			}
		} catch {
			/* observers optional */
		}
	});

	const url = `${baseUrl}${path}`;
	const response = await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
	const status = response?.status() ?? 0;

	// Give LCP/CLS a short settle window after networkidle.
	await page.waitForTimeout(1500);

	// Light interaction to surface INP when Event Timing is available.
	try {
		const target = page.locator("a, button").first();
		if (await target.count()) {
			await target.click({ trial: true }).catch(() => undefined);
			await target.hover({ timeout: 1000 }).catch(() => undefined);
			await page.mouse.move(200, 300);
			await page.mouse.down();
			await page.mouse.up();
		}
	} catch {
		/* ignore */
	}
	await page.waitForTimeout(500);

	const metrics = await page.evaluate(() => {
		const nav = performance.getEntriesByType("navigation")[0];
		const resources = performance.getEntriesByType("resource");
		const payloadResources = resources.filter((r) => r.name.includes("_payload"));
		const jsResources = resources.filter((r) => r.initiatorType === "script" || /\.js(\?|$)/.test(r.name));
		const cssResources = resources.filter(
			(r) => r.initiatorType === "css" || r.initiatorType === "link" || /\.css(\?|$)/.test(r.name)
		);

		const transferSum = (list) => list.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize || 0), 0);

		let hydrationMs = null;
		const marks = performance.getEntriesByType("mark").map((m) => m.name);
		const measures = performance.getEntriesByType("measure");
		const hydrateMeasure = measures.find((m) => /hydrat/i.test(m.name));
		if (hydrateMeasure) hydrationMs = hydrateMeasure.duration;

		const longTasks = window.__perfMetrics?.longTasks ?? [];
		const longTaskTotal = longTasks.reduce((sum, t) => sum + t.duration, 0);

		return {
			title: document.title,
			fcp: window.__perfMetrics?.fcp ?? null,
			lcp: window.__perfMetrics?.lcp ?? null,
			cls: window.__perfMetrics?.cls ?? 0,
			inp: window.__perfMetrics?.inp ?? null,
			ttfb: nav?.responseStart ?? null,
			domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
			loadEvent: nav?.loadEventEnd ?? null,
			transferSize: nav?.transferSize ?? null,
			encodedBodySize: nav?.encodedBodySize ?? null,
			decodedBodySize: nav?.decodedBodySize ?? null,
			jsTransfer: transferSum(jsResources),
			cssTransfer: transferSum(cssResources),
			payloadTransfer: transferSum(payloadResources),
			resourceCount: resources.length,
			longTaskCount: longTasks.length,
			longTaskTotalMs: longTaskTotal,
			longestTaskMs: longTasks.reduce((max, t) => Math.max(max, t.duration), 0),
			hydrationMs,
			marks,
			nuxtPayloadKeys: window.__NUXT__?.data ? Object.keys(window.__NUXT__.data).length : null,
		};
	});

	await context.close();

	return {
		path,
		status,
		...metrics,
		documentTtfbMs: documentTtfbMs ?? metrics.ttfb,
		documentEncodedBytes: documentEncodedBytes ?? metrics.encodedBodySize,
		headerResourceSizes: resourceSizes,
		backendRequestCount,
		backendHosts: [...backendHosts],
		payloadBytesObserved: payloadBytes || metrics.payloadTransfer,
	};
}

function summarize(runsForPath) {
	const pick = (key) => median(runsForPath.map((r) => r[key]));
	return {
		path: runsForPath[0].path,
		status: runsForPath[0].status,
		title: runsForPath[0].title,
		runs: runsForPath.length,
		ttfbMs: round(pick("documentTtfbMs") ?? pick("ttfb")),
		fcpMs: round(pick("fcp")),
		lcpMs: round(pick("lcp")),
		cls: round(pick("cls"), 3),
		inpMs: round(pick("inp")),
		dclMs: round(pick("domContentLoaded")),
		loadMs: round(pick("loadEvent")),
		documentKiB: kib(pick("documentEncodedBytes") ?? pick("encodedBodySize")),
		jsKiB: kib(pick("jsTransfer")),
		cssKiB: kib(pick("cssTransfer")),
		payloadKiB: kib(pick("payloadBytesObserved") ?? pick("payloadTransfer")),
		resourceCount: round(pick("resourceCount"), 0),
		longTaskCount: round(pick("longTaskCount"), 0),
		longTaskTotalMs: round(pick("longTaskTotalMs")),
		longestTaskMs: round(pick("longestTaskMs")),
		hydrationMs: round(pick("hydrationMs")),
		backendRequestCount: round(pick("backendRequestCount"), 0),
		nuxtPayloadKeys: round(pick("nuxtPayloadKeys"), 0),
	};
}

function printTable(rows) {
	const columns = [
		["path", "path"],
		["ttfbMs", "TTFB"],
		["fcpMs", "FCP"],
		["lcpMs", "LCP"],
		["cls", "CLS"],
		["inpMs", "INP"],
		["documentKiB", "doc KiB"],
		["jsKiB", "JS KiB"],
		["cssKiB", "CSS KiB"],
		["payloadKiB", "payload"],
		["backendRequestCount", "API"],
		["longTaskTotalMs", "longtasks"],
	];

	const lines = [];
	lines.push(columns.map(([, label]) => label.padEnd(12)).join(" "));
	for (const row of rows) {
		lines.push(
			columns
				.map(([key]) => {
					const value = row[key];
					const text = value == null ? "—" : String(value);
					return text.padEnd(12);
				})
				.join(" ")
		);
	}
	process.stdout.write(`${lines.join("\n")}\n`);
}

const browser = await chromium.launch({ headless: true });
const allRuns = [];

try {
	for (const path of paths) {
		for (let i = 0; i < runs; i += 1) {
			process.stderr.write(`Measuring ${path} run ${i + 1}/${runs}...\n`);
			const result = await measureOnce(browser, path);
			allRuns.push(result);
			if (result.status >= 400) {
				process.stderr.write(`  warning: HTTP ${result.status} for ${path}\n`);
			}
		}
	}
} finally {
	await browser.close();
}

const summaries = paths.map((path) => summarize(allRuns.filter((r) => r.path === path)));
const report = {
	measuredAt: new Date().toISOString(),
	baseUrl,
	viewport: VIEWPORT,
	runsPerPath: runs,
	cache: "cleared each run (new browser context)",
	throttling: "none",
	summaries,
	runs: allRuns,
};

const outPath = "docs/performance-runtime.json";
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

process.stdout.write("\nRuntime Web Vitals (median of cold runs)\n\n");
printTable(summaries);
process.stdout.write(`\nFull report: ${outPath}\n`);
