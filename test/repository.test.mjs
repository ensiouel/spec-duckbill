import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {
  captureRepositorySnapshot,
  detectEvidenceStaleness,
  initializeFeature,
  validateFeatureSlug,
  validateRepositoryPath,
  validateWriteBoundary,
} from "../scripts/repository.mjs";
import {initializeState, initializeStateFile, saveClarification, writeState} from "../scripts/state.mjs";
import {atomicWrite, sha256} from "../scripts/utils.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {encoding: "utf8"}).trim();
}

function repository(context) {
  const root = mkdtempSync(join(tmpdir(), "duckbill-repository-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  git(root, "init", "-q");
  git(root, "config", "user.email", "duckbill@example.test");
  git(root, "config", "user.name", "Duckbill Test");
  writeFileSync(join(root, "observed.txt"), "one\n");
  writeFileSync(join(root, "unrelated.txt"), "stable\n");
  git(root, "add", ".");
  git(root, "commit", "-qm", "initial");
  return root;
}

test("path traversal", (context) => {
  const root = repository(context);
  assert.throws(() => validateRepositoryPath(root, "../outside.txt"), {code: "PATH_TRAVERSAL"});
});

test("symlink traversal", (context) => {
  const root = repository(context);
  const outside = mkdtempSync(join(tmpdir(), "duckbill-outside-"));
  context.after(() => rmSync(outside, {recursive: true, force: true}));
  symlinkSync(outside, join(root, ".duckbill"));
  assert.throws(() => validateRepositoryPath(root, ".duckbill/specs/feature/spec.md"), {code: "SYMLINK_TRAVERSAL"});
});

test("write outside repository root is rejected", (context) => {
  const root = repository(context);
  assert.throws(() => validateRepositoryPath(root, "/tmp/outside.txt"), {code: "PATH_OUTSIDE_REPOSITORY"});
});

test("unauthorized changed path", (context) => {
  const root = repository(context);
  const before = captureRepositorySnapshot(root);
  writeFileSync(join(root, "unauthorized.txt"), "created\n");
  const after = captureRepositorySnapshot(root);
  const result = validateWriteBoundary(before, after, ["allowed.txt"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.unauthorizedPaths, ["unauthorized.txt"]);
});

test("pre-existing user changes are preserved and excluded from command changes", (context) => {
  const root = repository(context);
  writeFileSync(join(root, "unrelated.txt"), "user change\n");
  const before = captureRepositorySnapshot(root);
  writeFileSync(join(root, "allowed.txt"), "command change\n");
  const after = captureRepositorySnapshot(root);
  const result = validateWriteBoundary(before, after, ["allowed.txt"]);
  assert.equal(result.ok, true);
  assert.deepEqual(result.commandCreatedPaths, ["allowed.txt"]);
  assert.deepEqual(result.preservedPreExistingPaths, ["unrelated.txt"]);
});

test("dirty tree hash changes with working tree content", (context) => {
  const root = repository(context);
  const clean = captureRepositorySnapshot(root);
  writeFileSync(join(root, "observed.txt"), "two\n");
  const dirty = captureRepositorySnapshot(root);
  assert.notEqual(dirty.dirtyTreeHash, clean.dirtyTreeHash);
  assert.deepEqual(dirty.changedPaths, ["observed.txt"]);
});

test("observed path staleness", (context) => {
  const root = repository(context);
  const before = captureRepositorySnapshot(root, {observedPaths: ["observed.txt"]});
  const evidence = {commit: before.commit, observedPaths: ["observed.txt"], observedPathHashes: before.observedPathHashes};
  writeFileSync(join(root, "observed.txt"), "changed\n");
  const after = captureRepositorySnapshot(root, {observedPaths: ["observed.txt"]});
  const result = detectEvidenceStaleness(evidence, after);
  assert.equal(result.stale, true);
  assert.ok(result.reasons.includes("observed-path-changed:observed.txt"));
});

test("unrelated path change does not stale focused evidence", (context) => {
  const root = repository(context);
  const before = captureRepositorySnapshot(root, {observedPaths: ["observed.txt"]});
  const evidence = {commit: before.commit, observedPaths: ["observed.txt"], observedPathHashes: before.observedPathHashes};
  writeFileSync(join(root, "unrelated.txt"), "changed elsewhere\n");
  const after = captureRepositorySnapshot(root, {observedPaths: ["observed.txt"]});
  assert.deepEqual(detectEvidenceStaleness(evidence, after), {stale: false, reasons: []});
});

test("stale commit", (context) => {
  const root = repository(context);
  const before = captureRepositorySnapshot(root, {observedPaths: ["observed.txt"]});
  const evidence = {commit: before.commit, observedPaths: ["observed.txt"], observedPathHashes: before.observedPathHashes};
  writeFileSync(join(root, "unrelated.txt"), "new commit\n");
  git(root, "add", "unrelated.txt");
  git(root, "commit", "-qm", "second");
  const after = captureRepositorySnapshot(root, {observedPaths: ["observed.txt"]});
  assert.ok(detectEvidenceStaleness(evidence, after).reasons.includes("commit-changed"));
});

test("concurrent state writers", (context) => {
  const root = repository(context);
  const path = join(root, "state.json");
  const snapshot = captureRepositorySnapshot(root);
  const state = initializeState({featureId: "safe-feature", hashes: {}, repository: snapshot});
  initializeStateFile(path, state);
  const contextValue = {owner: "specification", questions: [{id: "Q-001", reason: "Changes behavior", question: "Which behavior?", options: []}], command: "duck-spec", skillMode: "create-spec", arguments: {feature: "safe-feature"}};
  const first = saveClarification(state, contextValue);
  const second = saveClarification(state, {...contextValue, questions: [{id: "Q-002", reason: "Changes scope", question: "Which scope?", options: []}]});
  writeState(path, first, 1);
  assert.throws(() => writeState(path, second, 1), {code: "REVISION_CONFLICT"});
});

test("atomic write failure leaves no temporary file", (context) => {
  const root = mkdtempSync(join(tmpdir(), "duckbill-atomic-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const target = join(root, "target");
  mkdirSync(target);
  writeFileSync(join(target, "keep.txt"), "keep\n");
  assert.throws(() => atomicWrite(target, "cannot replace a directory"));
  assert.deepEqual(readdirSync(root), ["target"]);
});

test("feature slug safety", () => {
  assert.equal(validateFeatureSlug("password-authentication"), "password-authentication");
  for (const value of ["../escape", "Feature", "two/slugs", "", "con", "a".repeat(81)]) {
    assert.throws(() => validateFeatureSlug(value), {code: "INVALID_FEATURE_SLUG"});
  }
});

test("feature initialization creates canonical safe paths once", (context) => {
  const root = repository(context);
  const template = join(root, "constitution-template.md");
  writeFileSync(template, "# Project Constitution\n");
  const result = initializeFeature(root, "safe-feature", template);
  assert.equal(readFileSync(join(root, result.paths.constitution), "utf8"), "# Project Constitution\n");
  assert.equal(existsSync(join(root, result.paths.directory)), true);
  assert.throws(() => initializeFeature(root, "safe-feature", template), {code: "FEATURE_EXISTS"});
});

test("every Pi command bootstraps the installed package runtime", () => {
  const expectedPrompts = [
    "duck-analyze.md",
    "duck-execute.md",
    "duck-init.md",
    "duck-plan.md",
    "duck-refine.md",
    "duck-spec.md",
    "duck-status.md",
    "duck-sync.md",
    "duck-validate.md",
  ];
  const actualPrompts = readdirSync(join(packageRoot, "prompts")).filter((name) => name.endsWith(".md")).sort();
  assert.deepEqual(actualPrompts, expectedPrompts);

  for (const name of actualPrompts) {
    const prompt = readFileSync(join(packageRoot, "prompts", name), "utf8");
    assert.match(prompt, /## Package bootstrap/u, name);
    assert.match(prompt, /`duckbill-artifacts` `<location>` in Pi's `<available_skills>`/u, name);
    assert.match(prompt, /Resolve `<package-root>` as `\.\.\/\.\.` from the directory containing that `SKILL\.md`/u, name);
    assert.match(prompt, /`name: "spec-duckbill"`/u, name);
    assert.match(prompt, /`pi\.prompts: \["\.\/prompts"\]`/u, name);
    assert.match(prompt, /`pi\.skills: \["\.\/skills"\]`/u, name);
    assert.match(prompt, /<package-root>\/scripts\//u, name);
    assert.match(prompt, /Invoke runtime scripts only through `node <package-root>\/scripts\/<script>\.mjs \.\.\.`/u, name);
    assert.match(prompt, /Never fall back to similarly named project files/u, name);
    assert.match(prompt, /return `blocked` with the bootstrap error/u, name);
    assert.match(prompt, /<package-root>\/scripts\/utils\.mjs/u, name);
  }
});

test("Pi package ships and consumes shared templates", () => {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "spec-duckbill");
  assert.deepEqual(manifest.pi, {prompts: ["./prompts"], skills: ["./skills"]});
  assert.ok(manifest.files.includes("scripts"));
  assert.ok(manifest.files.includes("templates"));

  const templateConsumers = {
    "duck-init.md": ["templates/constitution.md"],
    "duck-spec.md": ["templates/specification.md"],
    "duck-plan.md": ["templates/plan.md", "templates/tasks.md"],
  };
  for (const [promptName, templates] of Object.entries(templateConsumers)) {
    const prompt = readFileSync(join(packageRoot, "prompts", promptName), "utf8");
    for (const template of templates) {
      assert.ok(prompt.includes(`<package-root>/${template}`), `${promptName} must consume ${template}`);
      assert.equal(existsSync(join(packageRoot, template)), true, `${template} must be shipped`);
    }
  }

  const artifactSkill = readFileSync(join(packageRoot, "skills", "duckbill-artifacts", "SKILL.md"), "utf8");
  assert.match(artifactSkill, /"templates": \[\]/u);
  assert.match(artifactSkill, /Treat templates only as starting structure/u);
});
