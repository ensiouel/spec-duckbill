import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {parseSpec} from "../skills/duckbill-runtime/scripts/check.mjs";
import {
  captureRepositorySnapshot,
  detectEvidenceStaleness,
  initializeFeature,
  renderSpecificationDraft,
  validateFeatureSlug,
  validateRepositoryPath,
  validateWriteBoundary,
} from "../skills/duckbill-runtime/scripts/repository.mjs";
import {initializeState, initializeStateFile, loadState, saveClarification, writeState} from "../skills/duckbill-runtime/scripts/state.mjs";
import {atomicWrite} from "../skills/duckbill-runtime/scripts/utils.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = join(packageRoot, "skills", "duckbill-runtime");
const initRoot = join(packageRoot, "skills", "duckbill-init");
const planRoot = join(packageRoot, "skills", "duckbill-plan");

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

test("an allowed path cannot overwrite a pre-existing user change by default", (context) => {
  const root = repository(context);
  writeFileSync(join(root, "observed.txt"), "user change\n");
  const before = captureRepositorySnapshot(root);
  writeFileSync(join(root, "observed.txt"), "command replacement\n");
  const after = captureRepositorySnapshot(root);
  const result = validateWriteBoundary(before, after, ["observed.txt"]);
  assert.equal(result.ok, false);
  assert.deepEqual(result.unauthorizedPaths, []);
  assert.deepEqual(result.protectedPreExistingPaths, ["observed.txt"]);
});

test("an owned artifact may explicitly allow its pre-existing version", (context) => {
  const root = repository(context);
  writeFileSync(join(root, "observed.txt"), "editable draft\n");
  const before = captureRepositorySnapshot(root);
  writeFileSync(join(root, "observed.txt"), "refined artifact\n");
  const after = captureRepositorySnapshot(root);
  const result = validateWriteBoundary(before, after, ["observed.txt"], {allowedPreExistingPaths: ["observed.txt"]});
  assert.equal(result.ok, true);
  assert.deepEqual(result.protectedPreExistingPaths, []);
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
  const result = JSON.parse(execFileSync(process.execPath, [
    join(initRoot, "scripts", "init.mjs"),
    "init",
    "--repo", root,
    "--feature", "safe-feature",
    "--description", "Let people use the safe feature.",
  ], {encoding: "utf8"}));
  assert.equal(result.status, "completed");
  assert.deepEqual(result.changed, [
    ".duckbill/constitution.md",
    ".duckbill/specs/safe-feature/spec.md",
    ".duckbill/specs/safe-feature/state.json",
  ]);
  assert.match(readFileSync(join(root, ".duckbill", "constitution.md"), "utf8"), /^# Project Constitution$/mu);
  const draft = readFileSync(join(root, ".duckbill", "specs", "safe-feature", "spec.md"), "utf8");
  assert.match(draft, /feature-id: safe-feature/u);
  assert.match(draft, /status: draft/u);
  assert.match(draft, /plan-file: \.duckbill\/specs\/safe-feature\/plan\.md/u);
  assert.match(draft, /^# Safe Feature$/mu);
  assert.match(draft, /^## Feature Brief$/mu);
  assert.match(draft, /Let people use the safe feature\./u);
  assert.doesNotMatch(draft, /^## Actors$/mu);
  assert.doesNotMatch(draft, /\bUS-001\b/u);
  assert.doesNotMatch(draft, /<feature-id>/u);
  const state = loadState(join(root, ".duckbill", "specs", "safe-feature", "state.json"));
  assert.match(state.artifacts.specHash, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(state.artifacts.specHash, parseSpec(draft).hash);
  assert.equal(state.artifacts.planStatus, "missing");
  assert.equal(state.artifacts.tasksStatus, "missing");

  const rendered = execFileSync(process.execPath, [
    join(initRoot, "scripts", "init.mjs"), "render", "--json", JSON.stringify(result),
  ], {encoding: "utf8"});
  assert.match(rendered, /^Changed: \.duckbill\/constitution\.md,/u);
  assert.match(rendered, /Next: \/duck-spec safe-feature/u);

  assert.throws(() => initializeFeature(root, "safe-feature", {
    constitutionTemplate: join(initRoot, "assets", "constitution.md"),
    specificationTemplate: join(initRoot, "assets", "draft.md"),
  }), {code: "FEATURE_EXISTS"});
});

test("draft rendering keeps writing guidance when no description is supplied", () => {
  const template = readFileSync(join(initRoot, "assets", "draft.md"), "utf8");
  const draft = renderSpecificationDraft(template, "manual-draft");
  assert.match(draft, /^# Manual Draft$/mu);
  assert.match(draft, /^## Feature Brief$/mu);
  assert.match(draft, /<Describe what should be built, who needs it, why it is needed, expected behavior, and important boundaries\.>/u);
  assert.doesNotMatch(draft, /^## Requirements$/mu);
});

test("feature initialization validates both templates before creating project files", (context) => {
  const root = repository(context);
  const constitutionTemplate = join(root, "constitution-template.md");
  writeFileSync(constitutionTemplate, "# Project Constitution\n");
  assert.throws(() => initializeFeature(root, "safe-feature", {
    constitutionTemplate,
    specificationTemplate: join(root, "missing-specification-template.md"),
  }), {code: "TEMPLATE_NOT_FOUND"});
  assert.equal(existsSync(join(root, ".duckbill")), false);
});

test("every Pi command loads only its focused Duckbill skills", () => {
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

  const routes = {
    "duck-analyze.md": ["duckbill-runtime", "duckbill-specification", "duckbill-consistency"],
    "duck-execute.md": ["duckbill-runtime", "duckbill-consistency", "duckbill-execution", "duckbill-validation"],
    "duck-init.md": ["duckbill-init"],
    "duck-plan.md": ["duckbill-runtime", "duckbill-plan"],
    "duck-refine.md": ["duckbill-runtime", "duckbill-specification", "duckbill-plan", "duckbill-execution", "duckbill-validation"],
    "duck-spec.md": ["duckbill-runtime", "duckbill-specification"],
    "duck-status.md": ["duckbill-runtime"],
    "duck-sync.md": ["duckbill-runtime", "duckbill-consistency", "duckbill-plan"],
    "duck-validate.md": ["duckbill-runtime", "duckbill-consistency", "duckbill-validation"],
  };

  for (const name of actualPrompts) {
    const prompt = readFileSync(join(packageRoot, "prompts", name), "utf8");
    for (const skill of routes[name]) assert.ok(prompt.includes(`\`${skill}\``), `${name} must load ${skill}`);
    assert.doesNotMatch(prompt, /Package bootstrap|<package-root>|duckbill-artifacts|duckbill-implementation/u, name);
    assert.doesNotMatch(prompt, /--answers\b/u, `${name} must not expose an answer flag`);
    assert.match(prompt, /## Skills/u, name);
    assert.match(prompt, /## Permissions/u, name);
    assert.match(prompt, /## Flow/u, name);
    assert.doesNotMatch(prompt, /\.mjs\b|--repo\b|--feature\b|--expected-revision\b|<runtime-root>|<init-root>|<plan-root>/u, `${name} must not own runtime internals`);
    assert.doesNotMatch(prompt, /semantic boundary|final boundary|dirty-tree|observed path hashes|artifact hashes|latest revision/u, `${name} must not duplicate runtime rules`);
  }

  assert.match(readFileSync(join(packageRoot, "prompts", "duck-analyze.md"), "utf8"), /\$\{@:2\}/u);
  assert.match(readFileSync(join(packageRoot, "prompts", "duck-refine.md"), "utf8"), /\$\{@:2\}/u);
  for (const name of actualPrompts) {
    assert.doesNotMatch(readFileSync(join(packageRoot, "prompts", name), "utf8"), /`duckbill-[^`\s]+:[^`\s]+`/u, `${name} must name skill and mode separately`);
  }

  assert.doesNotMatch(readFileSync(join(packageRoot, "prompts", "duck-init.md"), "utf8"), /duckbill-runtime/u);
  for (const name of actualPrompts.filter((item) => !["duck-init.md", "duck-status.md"].includes(item))) {
    const prompt = readFileSync(join(packageRoot, "prompts", name), "utf8");
    assert.match(prompt, /Invoke `duckbill-runtime` with operation `prepare`/u, `${name} must invoke runtime preparation explicitly`);
    assert.match(prompt, /`duckbill-runtime` (?:with operation|operation) `finalize`/u, `${name} must invoke runtime finalization explicitly`);
    assert.match(prompt, /Invoke `duckbill-runtime` with operation `render`/u, `${name} must invoke runtime rendering explicitly`);
  }
});

test("Pi package ships seven focused skills with local assets", () => {
  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  assert.equal(manifest.name, "spec-duckbill");
  assert.deepEqual(manifest.pi, {prompts: ["./prompts"], skills: ["./skills"]});
  assert.deepEqual(manifest.files, ["prompts", "skills", "README.md", "LICENSE"]);
  assert.equal(existsSync(join(packageRoot, "scripts")), false);
  assert.equal(existsSync(join(packageRoot, "templates")), false);

  assert.deepEqual(readdirSync(join(packageRoot, "skills")).sort(), [
    "duckbill-consistency",
    "duckbill-execution",
    "duckbill-init",
    "duckbill-plan",
    "duckbill-runtime",
    "duckbill-specification",
    "duckbill-validation",
  ]);

  for (const path of [
    join(initRoot, "assets", "constitution.md"),
    join(initRoot, "assets", "draft.md"),
    join(initRoot, "scripts", "init.mjs"),
    join(planRoot, "assets", "plan.md"),
    join(planRoot, "assets", "tasks.md"),
  ]) {
    assert.equal(existsSync(path), true, `${path} must be shipped`);
    assert.equal(lstatSync(path).isFile(), true, `${path} must be a regular file`);
    assert.equal(lstatSync(path).isSymbolicLink(), false, `${path} must not be a symbolic link`);
  }

  const runtimeSkill = readFileSync(join(runtimeRoot, "SKILL.md"), "utf8");
  assert.match(runtimeSkill, /scripts\/check\.mjs/u);
  assert.match(runtimeSkill, /references\/operations\.md/u);
  assert.match(runtimeSkill, /references\/contracts\.md/u);
  assert.doesNotMatch(runtimeSkill, /assets\/specification\.md|assets\/plan\.md/u);
  const runtimeOperations = readFileSync(join(runtimeRoot, "references", "operations.md"), "utf8");
  assert.match(runtimeOperations, /--expected-revision/u);
  assert.match(runtimeOperations, /repository\.mjs snapshot/u);
  assert.match(runtimeOperations, /state\.mjs reconcile/u);
  assert.match(runtimeOperations, /utils\.mjs render/u);
  assert.match(runtimeOperations, /## `verify`/u);
  assert.doesNotMatch(readFileSync(join(runtimeRoot, "scripts", "repository.mjs"), "utf8"), /command === "init-feature"/u);
  assert.doesNotMatch(readFileSync(join(runtimeRoot, "scripts", "state.mjs"), "utf8"), /command === "init"/u);

  const initSkill = readFileSync(join(initRoot, "SKILL.md"), "utf8");
  assert.match(initSkill, /assets\/draft\.md/u);
  const initScript = readFileSync(join(initRoot, "scripts", "init.mjs"), "utf8");
  assert.doesNotMatch(initScript, /duckbill-(?:runtime|specification|plan|execution|validation|consistency)/u, "init must not import another skill's internals");
  const planSkill = readFileSync(join(planRoot, "SKILL.md"), "utf8");
  assert.match(planSkill, /assets\/plan\.md/u);
  assert.match(planSkill, /assets\/tasks\.md/u);
  assert.match(planSkill, /Treat templates only as starting structure/u);
  assert.doesNotMatch(readFileSync(join(planRoot, "references", "synchronization.md"), "utf8"), /duckbill-consistency/u);

  const specificationSkill = readFileSync(join(packageRoot, "skills", "duckbill-specification", "SKILL.md"), "utf8");
  assert.match(specificationSkill, /create-spec\|refine-spec\|analyze-spec/u);
  assert.doesNotMatch(specificationSkill, /assets\/draft\.md/u);
  assert.doesNotMatch(specificationSkill, /create-plan|sync-plan/u);
  assert.match(planSkill, /create-plan\|refine-plan\|sync-plan/u);
  assert.doesNotMatch(planSkill, /create-spec|refine-spec/u);

  const consistencySkill = readFileSync(join(packageRoot, "skills", "duckbill-consistency", "SKILL.md"), "utf8");
  assert.doesNotMatch(consistencySkill, /analyze-spec/u);
  const executionSkill = readFileSync(join(packageRoot, "skills", "duckbill-execution", "SKILL.md"), "utf8");
  assert.match(executionSkill, /"mode": "execute\|repair"/u);
});
