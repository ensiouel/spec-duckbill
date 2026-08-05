#!/usr/bin/env node

import {existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, realpathSync, statSync} from "node:fs";
import {relative, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {canonicalFeaturePaths, FEATURE_ID_PATTERN} from "./check.mjs";
import {
  DuckbillError,
  atomicCreate,
  errorPayload,
  normalizeRepositoryPath,
  pathInside,
  safeJoin,
  sha256,
} from "./utils.mjs";

function git(root, args, options = {}) {
  const result = spawnSync("git", ["-C", root, ...args], {encoding: options.encoding ?? "utf8", maxBuffer: 32 * 1024 * 1024});
  if (result.status !== 0 && !options.allowFailure) {
    throw new DuckbillError("GIT_ERROR", result.stderr?.trim() || `git ${args.join(" ")} failed`, {status: result.status});
  }
  return result;
}

export function findRepositoryRoot(start = process.cwd()) {
  const result = git(resolve(start), ["rev-parse", "--show-toplevel"]);
  const root = realpathSync(result.stdout.trim());
  if (!statSync(root).isDirectory()) throw new DuckbillError("REPOSITORY_NOT_FOUND", "Git root is not a directory");
  return root;
}

export function validateFeatureSlug(featureId) {
  if (typeof featureId !== "string" || !FEATURE_ID_PATTERN.test(featureId) || featureId.length > 80) {
    throw new DuckbillError("INVALID_FEATURE_SLUG", "feature must be lowercase kebab-case and at most 80 characters");
  }
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu.test(featureId)) {
    throw new DuckbillError("INVALID_FEATURE_SLUG", "feature resolves to a reserved filename");
  }
  return featureId;
}

export function validateRepositoryPath(root, repositoryPath, options = {}) {
  const normalized = normalizeRepositoryPath(repositoryPath);
  const absolute = safeJoin(root, normalized, options);
  if (!pathInside(root, absolute)) throw new DuckbillError("PATH_OUTSIDE_REPOSITORY", `path is outside repository: ${repositoryPath}`);
  return absolute;
}

export function validateFeaturePaths(root, featureId, options = {}) {
  validateFeatureSlug(featureId);
  const paths = canonicalFeaturePaths(featureId);
  for (const path of Object.values(paths)) {
    if (path === paths.directory) continue;
    validateRepositoryPath(root, path);
  }
  const directory = validateRepositoryPath(root, paths.directory);
  if (options.requireAbsent && existsSync(directory)) {
    throw new DuckbillError("FEATURE_EXISTS", `feature directory already exists: ${paths.directory}`);
  }
  return paths;
}

export function initializeFeature(root, featureId, constitutionTemplate) {
  const repositoryRoot = findRepositoryRoot(root);
  const paths = validateFeaturePaths(repositoryRoot, featureId, {requireAbsent: true});
  const templatePath = resolve(constitutionTemplate);
  if (!existsSync(templatePath) || !lstatSync(templatePath).isFile() || lstatSync(templatePath).isSymbolicLink()) {
    throw new DuckbillError("TEMPLATE_NOT_FOUND", `constitution template is missing or unsafe: ${constitutionTemplate}`);
  }
  const changed = [];
  const duckbillDirectory = validateRepositoryPath(repositoryRoot, ".duckbill");
  const specsDirectory = validateRepositoryPath(repositoryRoot, ".duckbill/specs");
  mkdirSync(duckbillDirectory, {recursive: true});
  mkdirSync(specsDirectory, {recursive: true});
  validateRepositoryPath(repositoryRoot, ".duckbill", {type: "directory"});
  validateRepositoryPath(repositoryRoot, ".duckbill/specs", {type: "directory"});
  const constitution = validateRepositoryPath(repositoryRoot, paths.constitution);
  if (!existsSync(constitution)) {
    atomicCreate(constitution, readFileSync(templatePath));
    changed.push(paths.constitution);
  }
  const featureDirectory = validateRepositoryPath(repositoryRoot, paths.directory);
  try { mkdirSync(featureDirectory); }
  catch (error) { if (error?.code === "EEXIST") throw new DuckbillError("FEATURE_EXISTS", `feature directory already exists: ${paths.directory}`); throw error; }
  return {paths, changed};
}

function parseStatus(root) {
  const result = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const records = result.stdout.split("\0");
  const statuses = new Map();
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    const status = record.slice(0, 2);
    const path = record.slice(3);
    if (path) statuses.set(path, status);
    if (/[RC]/u.test(status)) {
      const secondPath = records[index + 1];
      if (secondPath) {
        statuses.set(secondPath, status);
        index += 1;
      }
    }
  }
  return statuses;
}

export function hashRepositoryPath(root, repositoryPath) {
  const normalized = normalizeRepositoryPath(repositoryPath);
  const absolute = resolve(root, ...normalized.split("/"));
  if (!pathInside(root, absolute)) throw new DuckbillError("PATH_OUTSIDE_REPOSITORY", `path is outside repository: ${repositoryPath}`);
  if (!existsSync(absolute)) return "missing";
  let cursor = resolve(root);
  for (const segment of normalized.split("/")) {
    cursor = resolve(cursor, segment);
    if (!existsSync(cursor)) return "missing";
    if (lstatSync(cursor).isSymbolicLink()) {
      return sha256(`symlink:${relative(root, cursor).split(sep).join("/")}:${readlinkSync(cursor)}`);
    }
  }
  const stat = lstatSync(absolute);
  if (stat.isDirectory()) return sha256(`directory:${stat.mode & 0o777}`);
  if (!stat.isFile()) return sha256(`special:${stat.mode}`);
  return sha256(Buffer.concat([Buffer.from(`mode:${stat.mode & 0o777}\0`, "utf8"), readFileSync(absolute)]));
}

export function hashObservedPaths(root, paths) {
  const normalized = uniqueSorted(paths.map(normalizeRepositoryPath));
  return Object.fromEntries(normalized.map((path) => [path, hashRepositoryPath(root, path)]));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function captureRepositorySnapshot(root, options = {}) {
  const repositoryRoot = findRepositoryRoot(root);
  const commitResult = git(repositoryRoot, ["rev-parse", "HEAD"], {allowFailure: true});
  const commit = commitResult.status === 0 ? commitResult.stdout.trim() : null;
  const statuses = parseStatus(repositoryRoot);
  const changedPaths = uniqueSorted([...statuses.keys()]);
  const changedPathHashes = Object.fromEntries(changedPaths.map((path) => [path, hashRepositoryPath(repositoryRoot, path)]));
  const excluded = new Set(options.excludePaths ?? []);
  const dirtyEntries = changedPaths
    .filter((path) => !excluded.has(path) && !/^\.duckbill\/specs\/[^/]+\/state\.json(?:\.lock)?$/u.test(path))
    .map((path) => [path, statuses.get(path), changedPathHashes[path]]);
  const observedPaths = uniqueSorted(options.observedPaths ?? []);
  return {
    commit,
    dirtyTreeHash: sha256(JSON.stringify(dirtyEntries)),
    changedPaths,
    changedPathHashes,
    observedPathHashes: hashObservedPaths(repositoryRoot, observedPaths),
  };
}

export function commandCreatedPaths(before, after) {
  const candidates = uniqueSorted([...before.changedPaths, ...after.changedPaths]);
  return candidates.filter((path) => {
    const beforeChanged = before.changedPaths.includes(path);
    const afterChanged = after.changedPaths.includes(path);
    if (beforeChanged !== afterChanged) return true;
    return before.changedPathHashes[path] !== after.changedPathHashes[path];
  });
}

export function validateWriteBoundary(before, after, allowlist) {
  const allowed = new Set(allowlist.map(normalizeRepositoryPath));
  const created = commandCreatedPaths(before, after);
  const unauthorizedPaths = created.filter((path) => !allowed.has(path));
  const preExisting = new Set(before.changedPaths);
  return {
    ok: unauthorizedPaths.length === 0,
    commandCreatedPaths: created,
    unauthorizedPaths,
    preExistingChangedPaths: [...preExisting].sort(),
    touchedPreExistingPaths: created.filter((path) => preExisting.has(path)),
    preservedPreExistingPaths: [...preExisting].filter((path) => !created.includes(path)).sort(),
  };
}

export function detectEvidenceStaleness(evidence, currentSnapshot) {
  const reasons = [];
  if (!evidence || typeof evidence !== "object") return {stale: true, reasons: ["missing-evidence"]};
  if (evidence.commit !== currentSnapshot.commit) reasons.push("commit-changed");
  const recorded = evidence.observedPathHashes ?? {};
  const current = currentSnapshot.observedPathHashes ?? {};
  for (const path of uniqueSorted([...(evidence.observedPaths ?? []), ...Object.keys(recorded)])) {
    if (recorded[path] !== current[path]) reasons.push(`observed-path-changed:${path}`);
  }
  return {stale: reasons.length > 0, reasons};
}

export function detectRepositoryDrift(baseline, current, options = {}) {
  const reasons = [];
  if (baseline.commit !== current.commit) reasons.push("commit-changed");
  if (baseline.dirtyTreeHash !== current.dirtyTreeHash) reasons.push("dirty-tree-changed");
  for (const [path, hash] of Object.entries(baseline.observedPathHashes ?? {})) {
    if (current.observedPathHashes?.[path] !== hash) reasons.push(`observed-path-changed:${path}`);
  }
  for (const name of ["specHash", "planHash", "tasksHash"]) {
    if (options.baselineArtifacts?.[name] !== undefined && options.baselineArtifacts[name] !== options.currentArtifacts?.[name]) {
      reasons.push(`artifact-changed:${name}`);
    }
  }
  return {drift: reasons.length > 0, reasons};
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new DuckbillError("INVALID_ARGUMENT", `invalid argument: ${key ?? "missing"}`);
    options[key.slice(2)] = value;
  }
  return {command, options};
}

function main(argv) {
  const {command, options} = parseArgs(argv);
  const root = findRepositoryRoot(options.repo ?? process.cwd());
  if (command === "snapshot") {
    const observedPaths = options.observed ? JSON.parse(options.observed) : [];
    process.stdout.write(`${JSON.stringify(captureRepositorySnapshot(root, {observedPaths}))}\n`);
    return;
  }
  if (command === "feature-paths") {
    process.stdout.write(`${JSON.stringify(validateFeaturePaths(root, options.feature, {requireAbsent: options.absent === "true"}))}\n`);
    return;
  }
  if (command === "init-feature") {
    const result = initializeFeature(root, options.feature, options.template);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  if (command === "boundary") {
    const result = validateWriteBoundary(JSON.parse(options.before), captureRepositorySnapshot(root), JSON.parse(options.allowlist));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!result.ok) process.exitCode = 1;
    return;
  }
  if (command === "stale-evidence") {
    const evidence = JSON.parse(options.evidence);
    const current = captureRepositorySnapshot(root, {observedPaths: evidence.observedPaths ?? []});
    const result = detectEvidenceStaleness(evidence, current);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.stale) process.exitCode = 1;
    return;
  }
  throw new DuckbillError("INVALID_ARGUMENT", "usage: repository.mjs snapshot|feature-paths|init-feature|boundary|stale-evidence [options]");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
    process.exitCode = 1;
  }
}
