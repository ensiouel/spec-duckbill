#!/usr/bin/env node

import {createHash, randomBytes} from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  linkSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {dirname, isAbsolute, relative, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";

export const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/u;
export const RESULT_STATUSES = ["completed", "partial", "failed", "blocked", "unchanged", "needs_clarification"];

export class DuckbillError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "DuckbillError";
    this.code = code;
    this.details = details;
  }
}

export function errorPayload(error) {
  return {
    ok: false,
    error: {
      code: error?.code ?? "INTERNAL_ERROR",
      message: error?.message ?? String(error),
      ...(error?.details === undefined ? {} : {details: error.details}),
    },
  };
}

export function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function normalizeText(value) {
  return String(value).replace(/\r\n?/gu, "\n");
}

export function hashText(value) {
  return sha256(`${normalizeText(value).trimEnd()}\n`);
}

export function normalizeRepositoryPath(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new DuckbillError("INVALID_PATH", "repository path must be a non-empty string");
  }
  if (value.includes("\0") || value.includes("\\")) {
    throw new DuckbillError("INVALID_PATH", `repository path is not portable: ${value}`);
  }
  if (isAbsolute(value)) {
    throw new DuckbillError("PATH_OUTSIDE_REPOSITORY", `absolute repository path is forbidden: ${value}`);
  }
  const parts = value.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new DuckbillError("PATH_TRAVERSAL", `repository path contains an unsafe segment: ${value}`);
  }
  return parts.join("/");
}

export function pathInside(root, target, allowRoot = false) {
  const value = relative(resolve(root), resolve(target));
  if (value === "") return allowRoot;
  return value !== ".." && !value.startsWith(`..${sep}`) && !isAbsolute(value);
}

export function safeJoin(root, repositoryPath, options = {}) {
  const normalized = normalizeRepositoryPath(repositoryPath);
  const absoluteRoot = resolve(root);
  const target = resolve(absoluteRoot, ...normalized.split("/"));
  if (!pathInside(absoluteRoot, target)) {
    throw new DuckbillError("PATH_OUTSIDE_REPOSITORY", `path resolves outside repository: ${repositoryPath}`);
  }

  let cursor = absoluteRoot;
  for (const segment of normalized.split("/")) {
    cursor = resolve(cursor, segment);
    if (!existsSync(cursor)) continue;
    if (lstatSync(cursor).isSymbolicLink()) {
      throw new DuckbillError("SYMLINK_TRAVERSAL", `path traverses symbolic link: ${repositoryPath}`);
    }
  }

  if (options.mustExist && !existsSync(target)) {
    throw new DuckbillError("PATH_NOT_FOUND", `path does not exist: ${repositoryPath}`);
  }
  if (options.type && existsSync(target)) {
    const stat = lstatSync(target);
    if (options.type === "file" && !stat.isFile()) {
      throw new DuckbillError("INVALID_PATH_TYPE", `path is not a regular file: ${repositoryPath}`);
    }
    if (options.type === "directory" && !stat.isDirectory()) {
      throw new DuckbillError("INVALID_PATH_TYPE", `path is not a directory: ${repositoryPath}`);
    }
  }
  return target;
}

export function parseFrontmatter(source) {
  const normalized = normalizeText(source);
  const lines = normalized.split("\n");
  if (lines[0] !== "---") {
    throw new DuckbillError("INVALID_FRONTMATTER", "artifact must begin with frontmatter");
  }
  const end = lines.indexOf("---", 1);
  if (end < 0) throw new DuckbillError("INVALID_FRONTMATTER", "frontmatter closing delimiter is missing");
  const attributes = {};
  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (!line.trim() || /^\s*#/u.test(line)) continue;
    const match = line.match(/^([a-z][a-z0-9-]*):\s*(.*?)\s*$/u);
    if (!match) {
      throw new DuckbillError("INVALID_FRONTMATTER", `invalid frontmatter line ${index + 1}`);
    }
    const [, key, raw] = match;
    if (Object.hasOwn(attributes, key)) {
      throw new DuckbillError("DUPLICATE_FRONTMATTER_KEY", `duplicate frontmatter key: ${key}`);
    }
    attributes[key] = raw.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, (_whole, double, single) => double ?? single);
  }
  return {
    attributes,
    body: lines.slice(end + 1).join("\n"),
    bodyStartLine: end + 2,
    normalized,
  };
}

export function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new DuckbillError("INVALID_JSON", `cannot read JSON at ${path}: ${error.message}`);
  }
}

export function atomicWrite(path, value) {
  const directory = dirname(path);
  mkdirSync(directory, {recursive: true});
  const temporary = `${path}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  let descriptor;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    const data = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
    writeFileSync(descriptor, data);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
    try {
      const directoryDescriptor = openSync(directory, "r");
      fsyncSync(directoryDescriptor);
      closeSync(directoryDescriptor);
    } catch {
      // Some filesystems do not allow fsync on directories. The file rename is still atomic.
    }
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporary, {force: true});
  }
}

export function atomicCreate(path, value) {
  const directory = dirname(path);
  mkdirSync(directory, {recursive: true});
  const temporary = `${path}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  let descriptor;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    const data = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
    writeFileSync(descriptor, data);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    try { linkSync(temporary, path); }
    catch (error) { if (error?.code === "EEXIST") throw new DuckbillError("TARGET_EXISTS", `target already exists: ${path}`); throw error; }
    rmSync(temporary, {force: true});
    try {
      const directoryDescriptor = openSync(directory, "r");
      fsyncSync(directoryDescriptor);
      closeSync(directoryDescriptor);
    } catch {
      // Directory fsync is not available on every supported filesystem.
    }
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporary, {force: true});
  }
}

export function validateCommandResult(result) {
  const errors = [];
  if (!result || typeof result !== "object" || Array.isArray(result)) return ["result must be an object"];
  if (!Array.isArray(result.changed) || result.changed.some((item) => typeof item !== "string")) errors.push("changed must be a string array");
  if (!RESULT_STATUSES.includes(result.status)) errors.push("status is invalid");
  if (typeof result.reason !== "string" || !result.reason.trim()) errors.push("reason is required");
  if (result.next !== null) {
    if (!result.next || typeof result.next !== "object" || typeof result.next.command !== "string" || !Array.isArray(result.next.args)) {
      errors.push("next must be null or {command,args}");
    } else if (result.next.args.some((item) => typeof item !== "string")) {
      errors.push("next args must be strings");
    }
  }
  if (!Array.isArray(result.warnings)) errors.push("warnings must be an array");
  if (!Array.isArray(result.evidence)) errors.push("evidence must be an array");
  return errors;
}

function quoteArgument(value) {
  return /^[A-Za-z0-9._/:=-]+$/u.test(value) ? value : JSON.stringify(value);
}

export function renderCommandResult(result) {
  const errors = validateCommandResult(result);
  if (errors.length) throw new DuckbillError("INVALID_COMMAND_RESULT", "structured command result is invalid", {errors});
  const changed = [...new Set(result.changed)].sort();
  const next = result.next
    ? `/${result.next.command} ${result.next.args.map(quoteArgument).join(" ")}`.trimEnd()
    : "none";
  return [
    `Changed: ${changed.length ? changed.join(", ") : "none"}`,
    `Status: ${result.status}; ${result.reason.trim()}`,
    `Next: ${next}`,
  ].join("\n");
}

function main(argv) {
  if (argv[0] !== "render" || argv[1] !== "--json" || argv[2] === undefined || argv.length !== 3) {
    throw new DuckbillError("INVALID_ARGUMENT", "usage: utils.mjs render --json <structured-result>");
  }
  process.stdout.write(`${renderCommandResult(JSON.parse(argv[2]))}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
    process.exitCode = 1;
  }
}
