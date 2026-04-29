import { Spacer, Text } from "@mariozechner/pi-tui";

const UPDATE_LIST_PATCH = Symbol.for("pi-model-selector-x:update-list-patch");
const THEME_KEY = Symbol.for("@mariozechner/pi-coding-agent:theme");

// ── Theme ──

function getTheme() {
	return globalThis[THEME_KEY];
}

// ── Formatters ──

function formatContextWindow(tokens) {
	if (!tokens) return null;
	if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
	if (tokens >= 1000) return `${Math.round(tokens / 1000)}k`;
	return String(tokens);
}

function formatMaxTokens(tokens) {
	if (!tokens) return null;
	if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
	if (tokens >= 1000) return `${Math.round(tokens / 1000)}k`;
	return String(tokens);
}

function formatCostNum(value) {
	if (!value) return "0";
	if (value < 0.01) return value.toFixed(3);
	if (value < 1) return value.toFixed(2);
	if (value < 10) return value.toFixed(1);
	return Math.round(value).toString();
}

function formatCost(cost) {
	if (!cost) return null;
	const { input, output } = cost;
	if (!input && !output) return { label: "free", isFree: true };
	return {
		label: `$${formatCostNum(input)} / $${formatCostNum(output)}`,
		isFree: false,
	};
}

function formatInputShort(input) {
	if (!input || input.length === 0) return "txt";
	const parts = [];
	if (input.includes("text")) parts.push("txt");
	if (input.includes("image")) parts.push("img");
	if (input.includes("audio")) parts.push("aud");
	return parts.join("+") || "txt";
}

function formatProtocolShort(api) {
	if (!api) return null;
	const map = {
		"openai-responses": "resp",
		"openai-completions": "comp",
		"anthropic-messages": "anth",
	};
	return map[api] || api.slice(0, 5);
}

// ── Patched updateList ──

function appendDetailPane(selector) {
	const theme = getTheme();
	if (!theme) return;

	const selected = selector.filteredModels?.[selector.selectedIndex];
	if (!selected) return;

	const model = selected.model;
	const providerId = selected.provider;
	const apiProtocol = model.api || null;

	// Separator
	selector.listContainer.addChild(new Spacer(1));
	selector.listContainer.addChild(new Text(theme.fg("border", "  " + "─".repeat(50)), 0, 0));
	selector.listContainer.addChild(new Spacer(0));

	// Model full name + provider
	const fullName = model.name || model.id;
	selector.listContainer.addChild(
		new Text(
			`  ${theme.bold(theme.fg("accent", fullName))}` + theme.fg("muted", `  [${providerId}]`),
			0,
			0,
		),
	);

	// Line 1: Context · Max Output · Protocol · Input · Reasoning
	const line1Parts = [];

	if (model.contextWindow) {
		line1Parts.push(theme.fg("muted", "Context ") + theme.fg("accent", formatContextWindow(model.contextWindow)));
	}
	if (model.maxTokens) {
		line1Parts.push(theme.fg("muted", "MaxOut ") + theme.fg("muted", formatMaxTokens(model.maxTokens)));
	}
	if (apiProtocol) {
		line1Parts.push(theme.fg("muted", "API ") + theme.fg("accent", formatProtocolShort(apiProtocol)));
	}
	if (model.input) {
		line1Parts.push(theme.fg("muted", "Input ") + theme.fg("muted", formatInputShort(model.input)));
	}
	if (model.reasoning) {
		line1Parts.push(theme.fg("warning", "⚡ reasoning"));
	}

	if (line1Parts.length > 0) {
		selector.listContainer.addChild(new Text(`  ${line1Parts.join(theme.fg("muted", "  ·  "))}`, 0, 0));
	}

	// Line 2: Cost
	const costInfo = formatCost(model.cost);
	if (costInfo) {
		const costColor = costInfo.isFree ? "success" : "muted";
		let costLine = theme.fg("muted", "Cost ") + theme.fg(costColor, costInfo.label);

		if (model.cost?.cacheRead) {
			costLine += theme.fg("muted", "  ·  cache read ") + theme.fg("muted", `$${formatCostNum(model.cost.cacheRead)}`);
		}
		if (model.cost?.cacheWrite) {
			costLine += theme.fg("muted", "  ·  cache write ") + theme.fg("muted", `$${formatCostNum(model.cost.cacheWrite)}`);
		}

		selector.listContainer.addChild(new Text(`  ${costLine}`, 0, 0));
	}
}

// ── Patch / Unpatch ──

export function installModelSelectorXPatches(ModelSelectorComponent) {
	const proto = ModelSelectorComponent.prototype;
	uninstallModelSelectorXPatches(ModelSelectorComponent);

	const originalUpdateList = proto.updateList;
	const patchedUpdateList = function enhancedUpdateList() {
		originalUpdateList.call(this);
		try {
			appendDetailPane(this);
		} catch {
			// Silent — enhancement failure must not break the selector
		}
	};

	proto.updateList = patchedUpdateList;
	proto[UPDATE_LIST_PATCH] = {
		original: originalUpdateList,
		patched: patchedUpdateList,
	};
	return () => uninstallModelSelectorXPatches(ModelSelectorComponent);
}

function uninstallModelSelectorXPatches(ModelSelectorComponent) {
	const proto = ModelSelectorComponent.prototype;
	const patch = proto[UPDATE_LIST_PATCH];
	if (!patch) return;

	if (proto.updateList === patch.patched) {
		proto.updateList = patch.original;
	}
	delete proto[UPDATE_LIST_PATCH];
}
