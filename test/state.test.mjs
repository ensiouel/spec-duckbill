import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {parsePlan, parseSpec, parseTasks} from "../scripts/check.mjs";
import {
  beginOperation,
  featureValidationPrerequisites,
  finishOperation,
  initializeState,
  initializeStateFile,
  invalidateAfterPlanChange,
  invalidateAfterSpecChange,
  loadState,
  reconcileTasks,
  recordFeatureValidation,
  recordPrerequisites,
  recordSpecification,
  resumeClarification,
  saveClarification,
  validateState,
  writeState,
} from "../scripts/state.mjs";
import {sha256} from "../scripts/utils.mjs";

const fixtureRoot = join(import.meta.dirname, "fixtures", "valid", ".duckbill", "specs", "password-authentication");
const specSource = readFileSync(join(fixtureRoot, "spec.md"), "utf8");
const planSource = readFileSync(join(fixtureRoot, "plan.md"), "utf8");
const tasksSource = readFileSync(join(fixtureRoot, "tasks.md"), "utf8");
const specModel = parseSpec(specSource).model;
const planModel = parsePlan(planSource).model;
const tasksModel = parseTasks(tasksSource).model;
const hashes = {specHash: sha256("spec"), planHash: sha256("plan"), tasksHash: sha256("tasks")};
const repository = {commit: "abc123", dirtyTreeHash: sha256("dirty")};

function makeState(model = tasksModel) {
  return initializeState({featureId: "password-authentication", hashes, repository, taskIds: model.tasks.map((task) => task.id)});
}

function evidence(result = "passed", id = "CHK-001") {
  return {
    [id]: {
      result,
      summary: `${id} ${result}`,
      command: "node --test",
      exitCode: result === "passed" ? 0 : 1,
      commit: repository.commit,
      dirtyTreeHash: repository.dirtyTreeHash,
      observedPaths: [],
      observedPathHashes: {},
      outputDigest: sha256(`${id}-${result}`),
      ...hashes,
    },
  };
}

function begin(state, options = {}) {
  return beginOperation(state, {
    type: options.type ?? "execute",
    taskId: options.taskId ?? tasksModel.tasks[0].id,
    command: options.command ?? (options.type === "repair" ? "duck-refine" : "duck-execute"),
    feedback: options.feedback ?? null,
    feedbackReferences: options.feedbackReferences ?? [],
    tasksModel: options.tasksModel ?? tasksModel,
  });
}

function complete(state, options = {}) {
  const running = begin(state, options);
  return finishOperation(running, {taskId: options.taskId ?? tasksModel.tasks[0].id, outcome: "completed", evidence: evidence("passed", options.checkId ?? "CHK-001")});
}

function task(id, dependencies = [], fingerprint = id, requirements = ["FR-001"]) {
  return {id, dependencies, fingerprint, scenarios: ["US-001"], requirements};
}

test("state initialization", () => {
  const state = makeState();
  assert.equal(state.schema, "duckbill/state@1");
  assert.equal(state.revision, 1);
  assert.equal(state.tasks["implement-password-authentication"].status, "pending");
  assert.deepEqual(validateState(state), []);
});

test("invalid schema", () => {
  const state = makeState();
  state.schema = "duckbill/state@0";
  assert.match(validateState(state).join("\n"), /duckbill\/state@1/u);
});

test("revision conflict", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "duckbill-runtime-"));
  context.after(() => rmSync(directory, {recursive: true, force: true}));
  const path = join(directory, "state.json");
  const state = makeState();
  initializeStateFile(path, state);
  const next = saveClarification(state, {owner: "specification", questions: [{id: "Q-001", reason: "Changes behavior", question: "Which behavior?", options: []}], command: "duck-spec", skillMode: "create-spec", arguments: {feature: state.featureId}});
  assert.throws(() => writeState(path, next, 0), {code: "REVISION_CONFLICT"});
  assert.equal(loadState(path).revision, 1);
});

test("begin task", () => {
  const state = begin(makeState());
  assert.equal(state.tasks["implement-password-authentication"].status, "running");
  assert.equal(state.currentOperation.type, "execute");
  assert.equal(state.tasks["implement-password-authentication"].attempts.length, 1);
});

test("finish task", () => {
  const state = complete(makeState());
  assert.equal(state.currentOperation, null);
  assert.equal(state.tasks["implement-password-authentication"].status, "completed");
});

test("invalid task order while another task runs", () => {
  const model = {tasks: [task("first"), task("second")]};
  const state = begin(makeState(model), {taskId: "first", tasksModel: model});
  assert.throws(() => begin(state, {taskId: "second", tasksModel: model}), {code: "OPERATION_RUNNING"});
});

test("incomplete dependencies", () => {
  const model = {tasks: [task("first"), task("second", ["first"])]};
  assert.throws(() => begin(makeState(model), {taskId: "second", tasksModel: model}), {code: "INCOMPLETE_DEPENDENCIES"});
});

test("incomplete prerequisites block begin until current proof is recorded", () => {
  const model = {...tasksModel, prerequisites: [{id: "PRE-001", text: "Test service is available"}]};
  let state = makeState(model);
  assert.throws(() => begin(state, {tasksModel: model}), {code: "INCOMPLETE_PREREQUISITES"});
  state = recordPrerequisites(state, evidence("passed", "PRE-001"), ["PRE-001"]);
  assert.equal(begin(state, {tasksModel: model}).currentOperation.type, "execute");
});

for (const outcome of ["partial", "failed", "blocked"]) {
  test(`${outcome} outcome`, () => {
    const running = begin(makeState());
    const state = finishOperation(running, {taskId: tasksModel.tasks[0].id, outcome, evidence: evidence("failed")});
    assert.equal(state.tasks[tasksModel.tasks[0].id].status, outcome);
    assert.equal(state.currentOperation, null);
  });
}

test("completed outcome", () => {
  assert.equal(complete(makeState()).tasks[tasksModel.tasks[0].id].status, "completed");
});

test("repair completed task", () => {
  const completed = complete(makeState());
  const repaired = begin(completed, {type: "repair", feedback: "Preserve the denial cause", feedbackReferences: ["src/auth.js#L2"]});
  assert.equal(repaired.currentOperation.type, "repair");
  assert.equal(repaired.tasks[tasksModel.tasks[0].id].attempts.length, 2);
});

test("interrupted execute persists", () => {
  const state = begin(makeState());
  assert.equal(state.currentOperation.command, "duck-execute");
  assert.equal(state.tasks[tasksModel.tasks[0].id].attempts.at(-1).outcome, null);
});

test("interrupted repair and feedback persist", () => {
  const completed = complete(makeState());
  const state = begin(completed, {type: "repair", feedback: "Keep the original error", feedbackReferences: ["src/auth.js"]});
  assert.equal(state.currentOperation.feedback, "Keep the original error");
  assert.deepEqual(state.tasks[tasksModel.tasks[0].id].attempts.at(-1).feedbackReferences, ["src/auth.js"]);
});

test("pending clarification", () => {
  const state = saveClarification(makeState(), {
    owner: "specification",
    questions: [{id: "Q-001", reason: "Changes behavior", question: "Reject locked accounts?", options: []}],
    command: "duck-spec",
    skillMode: "create-spec",
    arguments: {feature: "password-authentication"},
  });
  assert.equal(state.pendingClarification.owner, "specification");
  assert.equal(state.pendingClarification.command, "duck-spec");
});

test("clarification resume", () => {
  const pending = saveClarification(makeState(), {
    owner: "plan",
    questions: [{id: "Q-001", reason: "Changes architecture", question: "Which boundary?", options: []}],
    command: "duck-plan",
    skillMode: "create-plan",
    arguments: {feature: "password-authentication"},
  });
  const result = resumeClarification(pending, {"Q-001": "Use the existing authentication boundary"});
  assert.equal(result.complete, true);
  assert.equal(result.state.pendingClarification, null);
  assert.equal(result.context.answers["Q-001"], "Use the existing authentication boundary");
});

test("affected task reset and transitive dependent reset", () => {
  const oldTasks = {tasks: [task("first", [], "old"), task("second", ["first"]), task("third", ["second"])]};
  let state = makeState(oldTasks);
  for (const id of ["first", "second", "third"]) state.tasks[id] = {...state.tasks[id], status: "completed", evidence: evidence("passed")};
  const newTasks = {tasks: [task("first", [], "new"), task("second", ["first"]), task("third", ["second"])]};
  const result = reconcileTasks(state, {oldTasks, newTasks, hashes, repository});
  assert.deepEqual(result.affectedTaskIds, ["first", "second", "third"]);
  assert.equal(result.state.tasks.third.status, "stale");
  assert.equal(result.state.tasks.third.attempts.length, 0);
});

test("unaffected evidence preservation", () => {
  const oldTasks = {tasks: [task("first", [], "same"), task("second", [], "old")]};
  const state = makeState(oldTasks);
  state.tasks.first.status = "completed";
  state.tasks.first.evidence = evidence("passed");
  state.tasks.second.status = "completed";
  state.tasks.second.evidence = evidence("passed", "CHK-002");
  const newTasks = {tasks: [task("first", [], "same"), task("second", [], "new")]};
  const result = reconcileTasks(state, {oldTasks, newTasks, hashes, repository});
  assert.equal(result.state.tasks.first.status, "completed");
  assert.deepEqual(result.state.tasks.first.evidence, state.tasks.first.evidence);
  assert.equal(result.state.tasks.second.status, "stale");
});

test("final validation prerequisites", () => {
  const completed = complete(makeState());
  const result = featureValidationPrerequisites(completed, {hashes, snapshot: {...repository, observedPathHashes: {}}});
  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
});

test("final validation rejects incomplete tasks", () => {
  const result = featureValidationPrerequisites(makeState(), {hashes, snapshot: {...repository, observedPathHashes: {}}});
  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((reason) => reason.startsWith("task-not-completed")));
});

test("invalidation after spec change", () => {
  const completed = complete(makeState());
  const newSpec = parseSpec(specSource.replace("accepts valid credentials", "accepts active valid credentials")).model;
  const result = invalidateAfterSpecChange(completed, {oldSpec: specModel, newSpec, tasksModel, specHash: sha256("new-spec")});
  assert.equal(result.state.artifacts.planStatus, "stale");
  assert.equal(result.state.artifacts.tasksStatus, "stale");
  assert.equal(result.state.tasks[tasksModel.tasks[0].id].status, "stale");
});

test("invalidation after plan change", () => {
  const completed = complete(makeState());
  const newPlan = parsePlan(planSource.replace("generic denial behavior; credential", "constant generic denial behavior; credential")).model;
  const result = invalidateAfterPlanChange(completed, {oldPlan: planModel, newPlan, tasksModel, planHash: sha256("new-plan")});
  assert.equal(result.state.artifacts.tasksStatus, "stale");
  assert.equal(result.state.tasks[tasksModel.tasks[0].id].status, "stale");
});

test("invalidation after task change", () => {
  const completed = complete(makeState());
  const newTasks = parseTasks(tasksSource.replace("Add password verification", "Add bounded password verification")).model;
  const result = reconcileTasks(completed, {oldTasks: tasksModel, newTasks, oldSpec: specModel, newSpec: specModel, oldPlan: planModel, newPlan: planModel, hashes: {...hashes, tasksHash: sha256("new-tasks")}, repository});
  assert.equal(result.state.tasks[tasksModel.tasks[0].id].status, "stale");
  assert.equal(result.state.tasks[tasksModel.tasks[0].id].attempts.length, 1);
});

test("main fixture flow reaches passed feature validation one task at a time", () => {
  let state = initializeState({featureId: "password-authentication", hashes: {}, repository});
  state = recordSpecification(state, {specHash: hashes.specHash, repository});
  const reconciled = reconcileTasks(state, {
    oldTasks: null,
    newTasks: tasksModel,
    oldSpec: null,
    newSpec: specModel,
    oldPlan: null,
    newPlan: planModel,
    hashes,
    repository,
  });
  state = complete(reconciled.state);
  const validationEvidence = {
    "VAL-001": Object.values(evidence("passed", "VAL-001"))[0],
    "VAL-002": Object.values(evidence("passed", "VAL-002"))[0],
  };
  state = recordFeatureValidation(state, {status: "passed", evidence: validationEvidence, repository});
  assert.equal(state.validation.status, "passed");
  assert.equal(state.tasks[tasksModel.tasks[0].id].attempts.length, 1);
});

test("integration fixture manifests cover required recovery flows", () => {
  const directory = join(import.meta.dirname, "fixtures", "flows");
  const fixtures = ["main", "spec-refinement", "plan-refinement", "code-refinement", "repository-drift"];
  for (const name of fixtures) {
    const fixture = JSON.parse(readFileSync(join(directory, `${name}.json`), "utf8"));
    assert.equal(fixture.name, name);
    assert.ok(fixture.steps.length >= 3);
  }
});
