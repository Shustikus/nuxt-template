/* eslint-disable no-console -- CI checker intentionally reports measured budgets. */
import { readdir, stat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const assetsDirectory = resolve(".output/public/_nuxt");
const budgets = {
	// Текущий production baseline ~3.3 MiB (много route chunks); запас ограничен ~15%.
	".js": { perFile: 400 * 1024, total: 3.8 * 1024 * 1024 },
	// Монолитный CSS (cssCodeSplit: false) baseline ~620 KiB после добавления ЛК; perFile ловит регрессии,
	// total — запас до ~13% и порог после возможного включения splitting.
	".css": { perFile: 650 * 1024, total: 700 * 1024 },
};

async function collectFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const path = join(directory, entry.name);
			return entry.isDirectory() ? collectFiles(path) : [path];
		})
	);
	return files.flat();
}

function formatKilobytes(bytes) {
	return `${(bytes / 1024).toFixed(1)} KiB`;
}

let files;
try {
	files = await collectFiles(assetsDirectory);
} catch (error) {
	console.error(`Bundle output not found at ${relative(process.cwd(), assetsDirectory)}. Run "npm run build" first.`);
	throw error;
}

const violations = [];

for (const [extension, budget] of Object.entries(budgets)) {
	const assets = files.filter((file) => extname(file) === extension);
	const sizes = await Promise.all(assets.map(async (file) => ({ file, size: (await stat(file)).size })));
	const total = sizes.reduce((sum, asset) => sum + asset.size, 0);

	for (const asset of sizes) {
		if (asset.size > budget.perFile) {
			violations.push(
				`${relative(assetsDirectory, asset.file)}: ${formatKilobytes(asset.size)} > ${formatKilobytes(budget.perFile)}`
			);
		}
	}

	if (total > budget.total) {
		violations.push(`total ${extension}: ${formatKilobytes(total)} > ${formatKilobytes(budget.total)}`);
	}

	console.log(
		`${extension}: ${assets.length} files, ${formatKilobytes(total)} total (budget ${formatKilobytes(budget.total)})`
	);
}

if (violations.length > 0) {
	console.error("\nBundle budget exceeded:");
	for (const violation of violations) console.error(`- ${violation}`);
	process.exitCode = 1;
} else {
	console.log("Bundle budget passed.");
}
