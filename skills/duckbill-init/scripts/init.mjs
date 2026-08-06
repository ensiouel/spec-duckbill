#!/usr/bin/env node

import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readlinkSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {createHash, randomUUID} from "node:crypto";
import {relative, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const initRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const FEATURE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const DESCRIPTION_MARKER = "<Describe what should be built, who needs it, why it is needed, expected behavior, and important boundaries.>";

class InitError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function inside(parent, candidate) {
  const value = relative(resolve(parent), resolve(candidate));
  return value === "" || (value !== ".." && !value.startsWith(`..${sep}`));
}

function featureId(value) {
  if (typeof value !== "string" || !FEATURE_PATTERN.test(value) || value.length > 80) {
    throw new InitError("INVALID_FEATURE_SLUG", "feature must be lowercase kebab-case and at most 80 characters");
  }
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu.test(value)) {
    throw new InitError("INVALID_FEATURE_SLUG", "feature resolves to a reserved filename");
  }
  return value;
}

function git(root, args, allowFailure = false) {
  const result = spawnSync("git", ["-C", root, ...args], {encoding: "utf8", maxBuffer: 32 * 1024 * 1024});
  if (result.status !== 0 && !allowFailure) {
    throw new InitError("GIT_ERROR", result.stderr?.trim() || `git ${args.join(" ")} failed`);
  }
  return result;
}

function repositoryRoot(start) {
  const result = git(resolve(start), ["rev-parse", "--show-toplevel"]);
  const root = resolve(result.stdout.trim());
  if (!statSync(root).isDirectory()) throw new InitError("REPOSITORY_NOT_FOUND", "Git root is not a directory");
  return root;
}

function repositoryPath(root, value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || value.split(/[\\/]/u).some((part) => part === ".." || part === "")) {
    throw new InitError("PATH_TRAVERSAL", `unsafe repository path: ${value}`);
  }
  const normalized = value.replaceAll("\\", "/");
  const absolute = resolve(root, ...normalized.split("/"));
  if (!inside(root, absolute)) throw new InitError("PATH_OUTSIDE_REPOSITORY", `path is outside repository: ${value}`);
  let cursor = resolve(root);
  for (const segment of normalized.split("/")) {
    cursor = resolve(cursor, segment);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) {
      throw new InitError("SYMLINK_TRAVERSAL", `path crosses a symbolic link: ${relative(root, cursor)}`);
    }
  }
  return absolute;
}

function asset(name) {
  const path = resolve(initRoot, "assets", name);
  if (!inside(initRoot, path) || !existsSync(path)) throw new InitError("INIT_RESOURCE_MISSING", `missing bundled asset: ${name}`);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new InitError("INIT_RESOURCE_UNSAFE", `bundled asset is not a regular file: ${name}`);
  return readFileSync(path, "utf8");
}

function atomicCreate(path, content) {
  if (existsSync(path)) throw new InitError("TARGET_EXISTS", `refusing to overwrite: ${path}`);
  const temporary = `${path}.${randomUUID()}.tmp`;
  let descriptor;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, content, "utf8");
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporary, {force: true});
  }
}

function hashPath(root, path) {
  const absolute = resolve(root, ...path.split("/"));
  if (!existsSync(absolute)) return "missing";
  const stat = lstatSync(absolute);
  if (stat.isSymbolicLink()) return sha256(`symlink:${readlinkSync(absolute)}`);
  if (!stat.isFile()) return sha256(`special:${stat.mode}`);
  return sha256(Buffer.concat([Buffer.from(`mode:${stat.mode & 0o777}\0`), readFileSync(absolute)]));
}

function snapshot(root) {
  const commitResult = git(root, ["rev-parse", "HEAD"], true);
  const commit = commitResult.status === 0 ? commitResult.stdout.trim() : null;
  const output = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]).stdout;
  const records = output.split("\0");
  const statuses = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    const status = record.slice(0, 2);
    const path = record.slice(3);
    if (path) statuses.set(path, status);
    if (/[RC]/u.test(status) && records[index + 1]) statuses.set(records[++index], status);
  }
  const changedPaths = [...statuses.keys()].sort();
  const changedPathHashes = Object.fromEntries(changedPaths.map((path) => [path, hashPath(root, path)]));
  const dirtyEntries = changedPaths
    .filter((path) => !/^\.duckbill\/specs\/[^/]+\/state\.json(?:\.lock)?$/u.test(path))
    .map((path) => [path, statuses.get(path), changedPathHashes[path]]);
  return {commit, dirtyTreeHash: sha256(JSON.stringify(dirtyEntries)), changedPaths, changedPathHashes};
}

function changedByCommand(before, after) {
  const candidates = [...new Set([...before.changedPaths, ...after.changedPaths])].sort();
  return candidates.filter((path) => before.changedPaths.includes(path) !== after.changedPaths.includes(path)
    || before.changedPathHashes[path] !== after.changedPathHashes[path]);
}

function boundary(before, after, allowlist) {
  const changed = changedByCommand(before, after);
  const allowed = new Set(allowlist);
  const unauthorized = changed.filter((path) => !allowed.has(path));
  const preExisting = new Set(before.changedPaths);
  const overwritten = changed.filter((path) => preExisting.has(path));
  return {ok: unauthorized.length === 0 && overwritten.length === 0, changed, unauthorized, overwritten};
}

function renderDraft(template, id, description) {
  if (!template.includes("schema: duckbill/spec@1") || !template.includes("status: draft") || !template.includes("<feature-id>")
    || !template.includes("# <Feature name>") || !template.includes("## Feature Brief") || !template.includes(DESCRIPTION_MARKER)) {
    throw new InitError("INVALID_TEMPLATE", "draft template lacks required markers");
  }
  const name = id.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
  let draft = template.replaceAll("<feature-id>", id).replace("# <Feature name>", `# ${name}`);
  if (typeof description === "string" && description.trim()) draft = draft.replace(DESCRIPTION_MARKER, description.trim());
  return draft;
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new InitError("INVALID_ARGUMENT", `invalid argument: ${key ?? "missing"}`);
    options[key.slice(2)] = value;
  }
  return options;
}

export function initializeFeatureWorkspace(options) {
  const id = featureId(options.feature);
  const root = repositoryRoot(options.repo ?? process.cwd());
  const before = snapshot(root);
  const constitutionSource = asset("constitution.md");
  const draftSource = renderDraft(asset("draft.md"), id, options.description ?? null);
  const directoryPath = `.duckbill/specs/${id}`;
  const constitutionPath = ".duckbill/constitution.md";
  const specPath = `${directoryPath}/spec.md`;
  const statePath = `${directoryPath}/state.json`;
  const directory = repositoryPath(root, directoryPath);
  if (existsSync(directory)) throw new InitError("FEATURE_EXISTS", `feature directory already exists: ${directoryPath}`);
  const duckbill = repositoryPath(root, ".duckbill");
  const specs = repositoryPath(root, ".duckbill/specs");
  mkdirSync(duckbill, {recursive: true});
  mkdirSync(specs, {recursive: true});
  repositoryPath(root, ".duckbill");
  repositoryPath(root, ".duckbill/specs");
  const changed = [];
  const constitution = repositoryPath(root, constitutionPath);
  if (!existsSync(constitution)) {
    atomicCreate(constitution, constitutionSource);
    changed.push(constitutionPath);
  }
  mkdirSync(directory);
  atomicCreate(repositoryPath(root, specPath), draftSource);
  changed.push(specPath);
  const artifactBoundary = boundary(before, snapshot(root), changed);
  if (!artifactBoundary.ok) return commandResult(artifactBoundary.changed, "blocked", `Initialization crossed its write boundary: ${[...artifactBoundary.unauthorized, ...artifactBoundary.overwritten].join(", ")}`);
  const repository = snapshot(root);
  const state = {
    schema: "duckbill/state@1",
    revision: 1,
    featureId: id,
    artifacts: {specHash: sha256(draftSource), planHash: null, tasksHash: null, planStatus: "missing", tasksStatus: "missing"},
    repository: {commit: repository.commit, dirtyTreeHash: repository.dirtyTreeHash},
    currentOperation: null,
    pendingClarification: null,
    prerequisites: {},
    tasks: {},
    validation: {status: "pending", evidence: {}, staleReasons: []},
  };
  atomicCreate(repositoryPath(root, statePath), `${JSON.stringify(state, null, 2)}\n`);
  changed.push(statePath);
  const finalBoundary = boundary(before, snapshot(root), changed);
  if (!finalBoundary.ok) return commandResult(finalBoundary.changed, "blocked", `Initialization crossed its write boundary: ${[...finalBoundary.unauthorized, ...finalBoundary.overwritten].join(", ")}`);
  return commandResult(changed, "completed", "Feature workspace and Feature Brief initialized", {command: "duck-spec", args: [id]});
}

function commandResult(changed, status, reason, next = null) {
  return {changed: [...new Set(changed)].sort(), status, reason, next, warnings: [], evidence: []};
}

function render(result) {
  const changed = result.changed.length ? [...result.changed].sort().join(", ") : "none";
  const next = result.next ? `/${result.next.command} ${result.next.args.join(" ")}` : "none";
  return `Changed: ${changed}\nStatus: ${result.status}; ${result.reason}\nNext: ${next}`;
}

function main(argv) {
  const [command, ...rest] = argv;
  if (command === "init") {
    process.stdout.write(`${JSON.stringify(initializeFeatureWorkspace(parseOptions(rest)))}\n`);
    return;
  }
  if (command === "render") {
    const options = parseOptions(rest);
    if (!options.json) throw new InitError("INVALID_ARGUMENT", "render requires --json");
    process.stdout.write(`${render(JSON.parse(options.json))}\n`);
    return;
  }
  throw new InitError("INVALID_ARGUMENT", "usage: init.mjs init --repo <root> --feature <id> [--description <text>] | render --json <result>");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ok: false, error: {code: error.code ?? "UNEXPECTED_ERROR", message: error.message, ...(error.details === undefined ? {} : {details: error.details})}})}\n`);
    process.exitCode = 1;
  }
}
