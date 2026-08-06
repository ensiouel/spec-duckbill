import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {initializeFeature, listFeatures, parseCommand, resolveFeature, safePath, tokenize, validateFeatureId} from "../src/workspace.mjs";

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {encoding: "utf8"}).trim();
}

function repository(context) {
  const root = mkdtempSync(join(tmpdir(), "duckbill-workspace-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  git(root, "init", "-q");
  return root;
}

test("tokenizer keeps quoted feedback", () => {
  assert.deepEqual(tokenize("feature spec 'keep this behavior'"), ["feature", "spec", "keep this behavior"]);
  assert.throws(() => tokenize("'unfinished"), /unfinished quote/u);
});

test("feature IDs and repository paths stay simple and safe", (context) => {
  const root = repository(context);
  assert.equal(validateFeatureId("safe-feature"), "safe-feature");
  assert.throws(() => validateFeatureId("../escape"), /lowercase/u);
  assert.throws(() => safePath(root, "../escape"), /leaves the repository/u);
  const outside = mkdtempSync(join(tmpdir(), "duckbill-outside-"));
  context.after(() => rmSync(outside, {recursive: true, force: true}));
  symlinkSync(outside, join(root, ".duckbill"));
  assert.throws(() => safePath(root, ".duckbill/specs/escape"), /symbolic link/u);
});

test("initialization creates ordinary files without runtime state", (context) => {
  const root = repository(context);
  const result = initializeFeature(root, "safe-feature", "Let users do the safe thing.");
  assert.match(result, /Next: \/duck:spec safe-feature/u);
  assert.deepEqual(listFeatures(root), ["safe-feature"]);
  assert.equal(existsSync(join(root, ".duckbill/specs/safe-feature/state.json")), false);
  const spec = readFileSync(join(root, ".duckbill/specs/safe-feature/spec.md"), "utf8");
  assert.match(spec, /feature-id: safe-feature/u);
  assert.match(spec, /Let users do the safe thing/u);
});

test("feature resolution always requires an explicit existing feature", (context) => {
  const root = repository(context);
  initializeFeature(root, "first-feature");
  assert.throws(() => resolveFeature(root, ""), /feature is required/u);
  assert.equal(resolveFeature(root, "first-feature"), "first-feature");
  initializeFeature(root, "second-feature");
  assert.equal(resolveFeature(root, "second-feature"), "second-feature");
  assert.throws(() => resolveFeature(root, "missing-feature"), /unknown feature/u);
});

test("commands use one strict positional syntax", (context) => {
  const root = repository(context);
  initializeFeature(root, "safe-feature");
  const contextValue = {root, featureId: "safe-feature"};
  assert.deepEqual(parseCommand("analyze", "safe-feature spec", contextValue), {featureId: "safe-feature", scope: "spec"});
  assert.deepEqual(parseCommand("refine", "safe-feature plan split lookup", {root, featureId: "safe-feature"}), {
    featureId: "safe-feature", scope: "plan", taskId: null, feedback: "split lookup",
  });
  assert.deepEqual(parseCommand("plan", "safe-feature focus on caching", {root, featureId: "safe-feature"}), {
    featureId: "safe-feature", description: "focus on caching",
  });
  assert.deepEqual(parseCommand("execute", "safe-feature task-one focused check", contextValue), {
    featureId: "safe-feature", taskId: "task-one", description: "focused check",
  });
  assert.deepEqual(parseCommand("refine", "safe-feature code task-one fix denial", contextValue), {
    featureId: "safe-feature", scope: "code", taskId: "task-one", feedback: "fix denial",
  });
});

test("commands reject missing, alternative, and extra structural arguments", (context) => {
  const root = repository(context);
  initializeFeature(root, "safe-feature");
  const value = {root, featureId: "safe-feature"};
  for (const [action, raw] of [
    ["analyze", "safe-feature"],
    ["analyze", "safe-feature spec extra"],
    ["analyze", "safe-feature --scope spec"],
    ["execute", "safe-feature"],
    ["refine", "safe-feature plan"],
    ["refine", "safe-feature --scope plan feedback"],
    ["refine", "safe-feature code task-one"],
    ["status", "safe-feature extra"],
  ]) {
    assert.throws(() => parseCommand(action, raw, value), undefined, `${action}: ${raw}`);
  }
});
