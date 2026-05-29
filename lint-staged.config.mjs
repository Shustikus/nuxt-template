import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const prettier = path.join(root, "node_modules/prettier/bin/prettier.cjs");
const eslint = path.join(root, "node_modules/eslint/bin/eslint.js");

/** @param {string[]} files */
function prettierWrite(files) {
	if (!files.length) return [];
	const list = files.map((file) => JSON.stringify(file)).join(" ");
	return `${JSON.stringify(node)} ${JSON.stringify(prettier)} --write ${list}`;
}

/** @param {string[]} files */
function eslintFix(files) {
	if (!files.length) return [];
	const list = files.map((file) => JSON.stringify(file)).join(" ");
	return `${JSON.stringify(node)} ${JSON.stringify(eslint)} --fix ${list}`;
}

/** @type {import('lint-staged').Configuration} */
export default {
	"*.{json,md,yml,yaml,css}": prettierWrite,
	"*.{js,mjs,cjs,ts,tsx,vue}": (files) => {
		if (!files.length) return [];
		return [prettierWrite(files), eslintFix(files)];
	},
};
