import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { installModelSelectorXPatches } from "./src/model-selector-x-component.js";

function getHostDistDir() {
	return dirname(realpathSync(process.argv[1]));
}

function getHostModuleUrl(relativePath) {
	return pathToFileURL(resolve(getHostDistDir(), relativePath)).href;
}

export default async function modelSelectorXExtension(pi) {
	const [{ ModelSelectorComponent }] = await Promise.all([
		import(getHostModuleUrl("modes/interactive/components/model-selector.js")),
	]);

	const unpatch = installModelSelectorXPatches(ModelSelectorComponent);

	pi.on("session_shutdown", unpatch);
}
