import { readdirSync, realpathSync, readFileSync } from "node:fs";
import { dirname, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

import { installModelSelectorXPatches } from "./src/model-selector-x-component.js";

function getHostDistDir() {
	return dirname(realpathSync(process.argv[1]));
}

function getHostModuleUrl(relativePath) {
	return pathToFileURL(resolve(getHostDistDir(), relativePath)).href;
}

// pi >= 0.84.3 ships a bundled CLI (dist/bundle/cli.js + hashed chunks). The
// unbundled dist files still exist but are dead copies; import the live chunk
// that pi itself loaded (ESM cache) so prototype patches take effect.
//
// The entry layout changed in pi 0.86.0: cli.js is now a tiny compile-cache
// shim that requires ./cli-runtime.js (the real ESM entry), so chunk refs no
// longer live in cli.js but in cli-runtime.js / index.js. Scan every
// top-level .js file in the bundle dir (entry first) instead of cli.js only.
async function importHostModelSelectorModule() {
	const entry = realpathSync(process.argv[1]);
	const entryDir = dirname(entry);
	if (basename(entryDir) !== "bundle") {
		// pi <= 0.84.2: unbundled dist layout.
		return import(getHostModuleUrl("modes/interactive/components/model-selector.js"));
	}
	const files = [
		...new Set([
			entry,
			...readdirSync(entryDir).filter((f) => f.endsWith(".js")).map((f) => resolve(entryDir, f)),
		]),
	];
	const seen = new Set();
	for (const file of files) {
		let src;
		try {
			src = readFileSync(file, "utf8");
		} catch {
			continue;
		}
		for (const m of src.matchAll(/["'](\.\/chunks\/[^"']+\.js)["']/g)) {
			if (seen.has(m[1])) continue;
			seen.add(m[1]);
			const mod = await import(pathToFileURL(resolve(entryDir, m[1])).href);
			if (mod?.ModelSelectorComponent) return mod;
		}
	}
	throw new Error("pi-model-selector-x: ModelSelectorComponent not found in host bundle chunks");
}

export default async function modelSelectorXExtension(pi) {
	const { ModelSelectorComponent } = await importHostModelSelectorModule();

	const unpatch = installModelSelectorXPatches(ModelSelectorComponent);

	pi.on("session_shutdown", unpatch);
}
