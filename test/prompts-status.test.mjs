import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtempSync, rmSync, utimesSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {buildPrompt, loadAsset, resourcesFor} from "../src/prompts.mjs";
import {featureStatus, prepareAction, tasks} from "../src/status.mjs";
import {initializeFeature} from "../src/workspace.mjs";

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {encoding: "utf8"}).trim();
}

function repository(context) {
  const root = mkdtempSync(join(tmpdir(), "duckbill-status-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  git(root, "init", "-q");
  initializeFeature(root, "safe-feature");
  return root;
}

test("each action loads only its private resources", () => {
  assert.ok(resourcesFor("spec").includes("skills/specification/SKILL.md"));
  assert.equal(resourcesFor("spec").some((path) => path.includes("execution")), false);
  assert.ok(resourcesFor("execute").includes("skills/execution/SKILL.md"));
  assert.throws(() => loadAsset("../package.json"), /leaves the package/u);
});

test("status is inferred from artifacts and task status", (context) => {
  const root = repository(context);
  const featureRoot = join(root, ".duckbill/specs/safe-feature");
  writeFileSync(join(featureRoot, "spec.md"), "---\nstatus: ready\n---\n# Safe Feature\n");
  writeFileSync(join(featureRoot, "plan.md"), "---\nstatus: ready\n---\n# Plan\n");
  writeFileSync(join(featureRoot, "tasks.md"), "# Tasks\n\n### Task 1: First\n\n**ID:** first\n\n**Status:** pending\n\n**Dependencies:** none\n");
  const status = featureStatus(root, "safe-feature");
  assert.equal(status.pending[0].id, "first");
  assert.equal(status.next, "/duck:execute safe-feature <task-id>");
  assert.deepEqual(status.ready.map((task) => task.id), ["first"]);
  assert.deepEqual(tasks("### Task\n\n**ID:** one\n\n**Status:** completed\n\n**Dependencies:** none\n"), {
    items: [{id: "one", status: "completed", dependencies: []}], issues: [],
  });
});

test("prompt contains paths and selected guidance but not artifact contents", (context) => {
  const root = repository(context);
  const status = featureStatus(root, "safe-feature");
  const prompt = buildPrompt({action: "spec", root, featureId: "safe-feature", input: {feedback: null}, status});
  assert.match(prompt, /skills\/specification\/SKILL\.md/u);
  assert.match(prompt, /\.duckbill\/specs\/safe-feature\/spec\.md/u);
  assert.doesNotMatch(prompt, /skills\/execution/u);
  assert.doesNotMatch(prompt, /duckbill_finish|state\.json|EV-001/u);
});

test("minimal flow gates keep planning and execution in order", (context) => {
  const root = repository(context);
  const draft = featureStatus(root, "safe-feature");
  assert.throws(() => prepareAction("plan", draft, {featureId: "safe-feature"}), /specification must be ready/u);

  const featureRoot = join(root, ".duckbill/specs/safe-feature");
  writeFileSync(join(featureRoot, "spec.md"), "---\nstatus: ready\n---\n# Safe Feature\n");
  const ready = featureStatus(root, "safe-feature");
  assert.throws(() => prepareAction("execute", ready, {featureId: "safe-feature", taskId: null}), /plan\.md and tasks\.md/u);
});

test("status reports malformed task metadata instead of guessing", (context) => {
  const root = repository(context);
  const featureRoot = join(root, ".duckbill/specs/safe-feature");
  writeFileSync(join(featureRoot, "spec.md"), "---\nstatus: ready\n---\n# Safe Feature\n");
  writeFileSync(join(featureRoot, "plan.md"), "---\nstatus: ready\n---\n# Plan\n");
  writeFileSync(join(featureRoot, "tasks.md"), "# Tasks\n\n### Task 1\n\n**ID:** first\n");
  const status = featureStatus(root, "safe-feature");
  assert.ok(status.issues.includes("task 1 is missing Status"));
  assert.ok(status.issues.includes("first is missing Dependencies"));
  assert.equal(status.next, null);
  assert.throws(() => prepareAction("execute", status, {taskId: "first"}), /artifacts are invalid/u);
});

test("status reports dependency cycles explicitly", (context) => {
  const root = repository(context);
  const featureRoot = join(root, ".duckbill/specs/safe-feature");
  writeFileSync(join(featureRoot, "spec.md"), "---\nstatus: ready\n---\n# Safe Feature\n");
  writeFileSync(join(featureRoot, "plan.md"), "---\nstatus: ready\n---\n# Plan\n");
  writeFileSync(join(featureRoot, "tasks.md"), [
    "# Tasks", "", "### Task 1", "", "**ID:** first", "", "**Status:** pending", "", "**Dependencies:** second",
    "", "### Task 2", "", "**ID:** second", "", "**Status:** pending", "", "**Dependencies:** first", "",
  ].join("\n"));
  assert.ok(featureStatus(root, "safe-feature").issues.includes("task dependencies contain a cycle"));
});

test("existing and stale artifacts route to explicit commands", (context) => {
  const root = repository(context);
  const featureRoot = join(root, ".duckbill/specs/safe-feature");
  const specPath = join(featureRoot, "spec.md");
  writeFileSync(specPath, "---\nstatus: ready\n---\n# Safe Feature\n");
  writeFileSync(join(featureRoot, "plan.md"), "---\nstatus: ready\n---\n# Plan\n");
  writeFileSync(join(featureRoot, "tasks.md"), "# Tasks\n\n### Task 1\n\n**ID:** first\n\n**Status:** pending\n\n**Dependencies:** none\n");
  const current = featureStatus(root, "safe-feature");
  assert.throws(() => prepareAction("spec", current, {featureId: "safe-feature"}), /use \/duck:refine/u);
  assert.throws(() => prepareAction("plan", current, {featureId: "safe-feature"}), /already exist/u);
  const future = new Date(Date.now() + 10_000);
  utimesSync(specPath, future, future);
  const stale = featureStatus(root, "safe-feature");
  assert.equal(stale.staleReason, "spec.md was modified after plan.md");
  assert.throws(() => prepareAction("execute", stale, {taskId: "first"}), /plan is stale/u);
});
