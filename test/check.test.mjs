import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import test from "node:test";
import {checkArtifacts, parsePlan, parseSpec, parseTasks} from "../scripts/check.mjs";

const fixtureRoot = join(import.meta.dirname, "fixtures", "valid", ".duckbill", "specs", "password-authentication");
const specPath = ".duckbill/specs/password-authentication/spec.md";
const planPath = ".duckbill/specs/password-authentication/plan.md";
const tasksPath = ".duckbill/specs/password-authentication/tasks.md";
const spec = readFileSync(join(fixtureRoot, "spec.md"), "utf8");
const plan = readFileSync(join(fixtureRoot, "plan.md"), "utf8");
const tasks = readFileSync(join(fixtureRoot, "tasks.md"), "utf8");

function check(overrides = {}) {
  return checkArtifacts({specSource: spec, planSource: plan, tasksSource: tasks, specPath, planPath, tasksPath, ...overrides});
}

function codes(result) {
  return result.errors.map((error) => error.code);
}

function twoTaskSource(firstDependency = "none", secondDependency = "implement-password-authentication") {
  const first = tasks.replace("**Dependencies:** none", `**Dependencies:** ${firstDependency}`);
  const second = `
### Task 2: Integrate the authentication result

**ID:** integrate-authentication-result

**User Scenarios:** US-001

**Requirements:** FR-001, NFR-001, AC-001

**Dependencies:** ${secondDependency}

**Context:**

- Authentication integration boundary described by the technical plan.

**Actions:**

1. Integrate the verified authentication result.

**Checks:**

- **CHK-003:** Focused integration tests pass.

`;
  return first.replace("## Feature Validation", `${second}## Feature Validation`);
}

test("valid spec", () => assert.deepEqual(parseSpec(spec).errors, []));
test("valid plan", () => assert.deepEqual(parsePlan(plan).errors, []));
test("valid tasks", () => assert.deepEqual(parseTasks(tasks).errors, []));
test("valid complete artifact set", () => assert.equal(check().ok, true));

test("invalid schema", () => {
  assert.ok(codes(check({specSource: spec.replace("duckbill/spec@1", "duckbill/spec@2")})).includes("INVALID_FRONTMATTER_VALUE"));
});

test("duplicate IDs", () => {
  const changed = spec.replace(
    "- **FR-001:** The product accepts valid credentials and rejects invalid credentials without disclosing account existence.",
    "- **FR-001:** The product accepts valid credentials and rejects invalid credentials without disclosing account existence.\n- **FR-001:** Duplicate meaning.",
  );
  assert.ok(codes(check({specSource: changed})).includes("DUPLICATE_ID"));
});

test("unknown requirement mapping", () => {
  const changed = tasks.replace("FR-001, NFR-001, AC-001", "FR-999, NFR-001, AC-001");
  assert.ok(codes(check({tasksSource: changed})).includes("UNKNOWN_REQUIREMENT_MAPPING"));
});

test("unknown scenario mapping", () => {
  const changed = tasks.replace("**User Scenarios:** US-001", "**User Scenarios:** US-999");
  assert.ok(codes(check({tasksSource: changed})).includes("UNKNOWN_SCENARIO_MAPPING"));
});

test("invalid reciprocal links", () => {
  const changed = plan.replace("tasks-file: .duckbill/specs/password-authentication/tasks.md", "tasks-file: .duckbill/specs/password-authentication/other.md");
  assert.ok(codes(check({planSource: changed})).includes("INVALID_RECIPROCAL_LINK"));
});

test("mismatched feature IDs", () => {
  const changed = plan.replace("feature-id: password-authentication", "feature-id: other-feature");
  assert.ok(codes(check({planSource: changed})).includes("MISMATCHED_FEATURE_ID"));
});

test("missing required sections", () => {
  const changed = spec.replace("## Actors", "## Participants");
  assert.ok(codes(check({specSource: changed})).includes("MISSING_SECTION"));
});

test("unresolved specification", () => {
  const changed = spec.replace("Allow a registered person", "TODO: Allow a registered person");
  assert.ok(codes(check({specSource: changed})).includes("UNRESOLVED_PLACEHOLDER"));
});

test("deterministic implementation-detail detection", () => {
  const changed = spec.replace("Allow a registered person", "Implement src/auth/password.ts so a registered person can");
  assert.ok(codes(check({specSource: changed})).includes("IMPLEMENTATION_DETAIL_IN_SPEC"));
});

test("task without Actions", () => {
  const changed = tasks.replace(/\*\*Actions:\*\*[\s\S]*?\*\*Checks:\*\*/u, "**Checks:**");
  assert.ok(codes(check({tasksSource: changed})).includes("MISSING_TASK_ACTIONS"));
});

test("task without Checks", () => {
  const changed = tasks.replace(/\*\*Checks:\*\*[\s\S]*?## Feature Validation/u, "## Feature Validation");
  assert.ok(codes(check({tasksSource: changed})).includes("MISSING_TASK_CHECKS"));
});

test("checkbox detection", () => {
  const changed = tasks.replace("1. Add password verification", "- [ ] Add password verification");
  assert.ok(codes(check({tasksSource: changed})).includes("CHECKBOX_FORBIDDEN"));
});

test("runtime state is forbidden in tasks", () => {
  const changed = tasks.replace("**Dependencies:** none", "**Dependencies:** none\n\n**Status:** completed");
  assert.ok(codes(check({tasksSource: changed})).includes("RUNTIME_STATE_FORBIDDEN"));
});

test("evidence is forbidden in plan", () => {
  const changed = plan.replace("## References", "**Evidence:** passed\n\n## References");
  assert.ok(codes(check({planSource: changed})).includes("RUNTIME_STATE_FORBIDDEN"));
});

test("unknown dependency", () => {
  const changed = tasks.replace("**Dependencies:** none", "**Dependencies:** missing-task");
  assert.ok(codes(check({tasksSource: changed})).includes("UNKNOWN_DEPENDENCY"));
});

test("self-dependency", () => {
  const changed = tasks.replace("**Dependencies:** none", "**Dependencies:** implement-password-authentication");
  assert.ok(codes(check({tasksSource: changed})).includes("SELF_DEPENDENCY"));
});

test("dependency cycle", () => {
  const changed = twoTaskSource("integrate-authentication-result");
  assert.ok(codes(check({tasksSource: changed})).includes("DEPENDENCY_CYCLE"));
});

test("missing requirement coverage", () => {
  const changed = tasks.replace("FR-001, NFR-001, AC-001", "FR-001, AC-001");
  assert.ok(codes(check({tasksSource: changed})).includes("MISSING_TASK_COVERAGE"));
});

test("missing validation coverage", () => {
  const changed = tasks.replace("- **VAL-002:** [NFR-001] The documented timing validation passes.\n", "");
  assert.ok(codes(check({tasksSource: changed})).includes("MISSING_VALIDATION_COVERAGE"));
});

test("canonical .duckbill feature paths", () => {
  const changed = spec.replace("plan-file: .duckbill/specs/password-authentication/plan.md", "plan-file: specs/password-authentication/plan.md");
  assert.ok(codes(check({specSource: changed})).includes("INVALID_CANONICAL_PATH"));
});
