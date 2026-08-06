import {existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from "node:fs";
import {dirname, relative, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {gitInfo, gitRoot} from "./git.mjs";

const FEATURE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export function tokenize(value) {
  const tokens = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (const character of String(value ?? "")) {
    if (escaped) { current += character; escaped = false; continue; }
    if (character === "\\") { escaped = true; continue; }
    if (quote) { if (character === quote) quote = null; else current += character; continue; }
    if (character === "\"" || character === "'") { quote = character; continue; }
    if (/\s/u.test(character)) { if (current) { tokens.push(current); current = ""; } continue; }
    current += character;
  }
  if (escaped || quote) throw new Error("unfinished quote or escape in command arguments");
  if (current) tokens.push(current);
  return tokens;
}

export function validateFeatureId(value) {
  if (!FEATURE_PATTERN.test(String(value ?? "")) || value.length > 80) {
    throw new Error("feature must use lowercase letters, numbers, and single hyphens");
  }
  return value;
}

export function findRepositoryRoot(cwd = process.cwd()) {
  const root = gitRoot(cwd);
  if (!root) throw new Error("run Duckbill inside a Git repository");
  return root;
}

export function safePath(root, path) {
  const absolute = resolve(root, path);
  const relation = relative(root, absolute);
  if (relation === ".." || relation.startsWith(`..${sep}`)) throw new Error(`path leaves the repository: ${path}`);
  let current = resolve(root);
  for (const part of relation.split(sep).filter(Boolean)) {
    current = resolve(current, part);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error(`path crosses a symbolic link: ${path}`);
  }
  return absolute;
}

export function featurePaths(root, featureId) {
  validateFeatureId(featureId);
  const directory = `.duckbill/specs/${featureId}`;
  return {
    root,
    featureId,
    directory,
    constitution: ".duckbill/constitution.md",
    spec: `${directory}/spec.md`,
    plan: `${directory}/plan.md`,
    tasks: `${directory}/tasks.md`,
  };
}

export function listFeatures(root) {
  const directory = safePath(root, ".duckbill/specs");
  if (!existsSync(directory)) return [];
  return readdirSync(directory, {withFileTypes: true})
    .filter((entry) => entry.isDirectory() && FEATURE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export function resolveFeature(root, raw = "") {
  const features = listFeatures(root);
  const first = tokenize(raw)[0];
  if (!first) throw new Error("feature is required");
  validateFeatureId(first);
  if (!features.includes(first)) throw new Error(`unknown feature: ${first}; run /duck:init ${first} first`);
  return first;
}

function remainingTokens(raw, root, featureId) {
  const tokens = tokenize(raw);
  return root && tokens[0] === featureId && listFeatures(root).includes(tokens[0]) ? tokens.slice(1) : tokens;
}

export function parseCommand(action, raw, context = {}) {
  const tokens = remainingTokens(raw, context.root, context.featureId);
  if (action === "init") {
    if (!tokens[0]) throw new Error("/duck:init requires <feature>");
    validateFeatureId(tokens[0]);
    return {featureId: tokens[0], description: tokens.slice(1).join(" ") || null};
  }
  if (action === "analyze") {
    if (tokens.length !== 1 || !["spec", "all"].includes(tokens[0])) throw new Error("/duck:analyze requires <feature> <spec|all>");
    return {featureId: context.featureId, scope: tokens[0]};
  }
  if (action === "refine") {
    const scope = tokens[0];
    if (!["spec", "plan", "code"].includes(scope)) throw new Error("/duck:refine requires <feature> <spec|plan|code> ...");
    if (scope === "code") {
      if (tokens.length < 3) throw new Error("/duck:refine code requires <feature> code <task-id> <feedback>");
      return {featureId: context.featureId, scope, taskId: tokens[1], feedback: tokens.slice(2).join(" ")};
    }
    if (tokens.length < 2) throw new Error(`/duck:refine ${scope} requires feedback`);
    return {featureId: context.featureId, scope, taskId: null, feedback: tokens.slice(1).join(" ")};
  }
  if (action === "execute") {
    if (!tokens[0]) throw new Error("/duck:execute requires <feature> <task-id>");
    return {featureId: context.featureId, taskId: tokens[0], description: tokens.slice(1).join(" ") || null};
  }
  if (action === "status") {
    if (tokens.length > 0) throw new Error("/duck:status accepts only <feature>");
    return {featureId: context.featureId};
  }
  if (["spec", "plan", "sync", "validate"].includes(action)) {
    return {featureId: context.featureId, description: tokens.join(" ") || null};
  }
  throw new Error(`unknown Duckbill action: ${action}`);
}

export function readFeature(root, featureId) {
  const paths = featurePaths(root, featureId);
  const read = (path) => existsSync(safePath(root, path)) ? readFileSync(safePath(root, path), "utf8") : null;
  return {paths, constitution: read(paths.constitution), spec: read(paths.spec), plan: read(paths.plan), tasks: read(paths.tasks), git: gitInfo(root)};
}

function asset(path) {
  return readFileSync(resolve(packageRoot, "assets", path), "utf8");
}

function title(featureId) {
  return featureId.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function render(template, featureId, description) {
  return template
    .replaceAll("<feature-id>", featureId)
    .replaceAll("<Feature name>", title(featureId))
    .replace("<Describe what should be built, who needs it, why it is needed, expected behavior, and important boundaries.>", description || "<Describe the feature in ordinary language.>");
}

export function initializeFeature(cwd, featureId, description = null) {
  const root = findRepositoryRoot(cwd);
  const paths = featurePaths(root, featureId);
  if (existsSync(safePath(root, paths.directory))) throw new Error(`feature already exists: ${featureId}`);
  mkdirSync(safePath(root, paths.directory), {recursive: true});
  const changed = [];
  if (!existsSync(safePath(root, paths.constitution))) {
    mkdirSync(dirname(safePath(root, paths.constitution)), {recursive: true});
    writeFileSync(safePath(root, paths.constitution), asset("templates/constitution.md"));
    changed.push(paths.constitution);
  }
  writeFileSync(safePath(root, paths.spec), render(asset("templates/draft.md"), featureId, description));
  changed.push(paths.spec);
  return `Created ${featureId}:\n${changed.map((path) => `- ${path}`).join("\n")}\nNext: /duck:spec ${featureId}`;
}
