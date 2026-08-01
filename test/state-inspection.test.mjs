import assert from "node:assert/strict";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {parsePlan, validateState} from "../scripts/state.mjs";

const stateScript = resolve("scripts/state.mjs");

function git(repo, ...args) {
    const result = spawnSync("git", ["-C", repo, ...args], {encoding: "utf8"});
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
}

function createRepo() {
    const repo = mkdtempSync(join(tmpdir(), "duckbill-workflow-state-test-"));
    git(repo, "init", "--quiet");
    git(repo, "config", "user.name", "Duckbill Test");
    git(repo, "config", "user.email", "duckbill@example.invalid");
    return repo;
}

function write(repo, path, content) {
    const target = join(repo, path);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, content);
    return target;
}

function specification(extra = "") {
    return `---
plan-file: specs/plans/demo/plan.md
---

# Demo

## Overview

Build the demo.${extra}

## Requirements

### Functional Requirements

- **FR-001:** Demo works.

### Non-Functional Requirements

- **NFR-001:** Demo remains testable.

## Acceptance Criteria

- **AC-001:** Demo works end to end.
`;
}

function plan({second = true, extraCriterion = false, extraPrerequisite = false, prerequisites = true} = {}) {
    const secondStep = second ? `
### Step 2: Second

**ID:** second

**Requirements:** FR-001

**Context:**

- Existing context.

**Actions:**

1. Implement second.

**Success Criteria:**

- **SC-002:** Second works.

**Dependencies:** first
` : "";
    return `---
spec-file: specs/demo.md
---

# Implementation Plan: Demo

## Overview

Demo plan.

## Goals

- Deliver demo.

## Scope

**In scope**

- Demo.

**Out of scope**

- Other work.

## Prerequisites

${prerequisites ? `- **PRE-001:** Environment is ready.${extraPrerequisite ? "\n- **PRE-002:** Dependency is ready." : ""}` : "None."}

## Implementation Steps

### Step 1: First

**ID:** first

**Requirements:** FR-001

**Context:**

- Existing context.

**Actions:**

1. Implement first.

**Success Criteria:**

- **SC-001:** First works.
${extraCriterion ? "- **SC-003:** First remains safe.\n" : ""}
**Dependencies:** none
${secondStep}
## Validation Checklist

- **VAL-001:** Verify AC-001 end to end.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| None | None |
`;
}

function command(repo, planPath, action, options = {}) {
    const args = [stateScript, action, "--plan", planPath, "--repo", repo];
    for (const [key, value] of Object.entries(options)) args.push(`--${key}`, String(value));
    return spawnSync(process.execPath, args, {encoding: "utf8"});
}

function checks(...items) {
    return JSON.stringify(items.map(([id, result = "passed", evidence = `${id} verified`]) => ({id, result, evidence})));
}

function setup(context, options = {}) {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    write(repo, "specs/demo.md", specification());
    const path = write(repo, "specs/plans/demo/plan.md", plan(options));
    return {repo, path};
}

test("plan hash is stable across LF and CRLF", () => {
    const source = plan();
    assert.equal(parsePlan(source).hash, parsePlan(source.replace(/\n/gu, "\r\n")).hash);
});

test("workflow metadata does not change content hashes", (context) => {
    assert.equal(parsePlan(plan()).hash, parsePlan(plan().replace("specs/demo.md", "specs/other.md")).hash);

    const {repo, path} = setup(context, {second: false});
    assert.equal(command(repo, path, "init").status, 0);
    write(repo, "specs/demo.md", specification().replace("specs/plans/demo/plan.md", "specs/plans/other/plan.md"));
    assert.equal(JSON.parse(command(repo, path, "read").stdout).specOutdated, false);
});

test("plans may omit prerequisites and ignore step-like headings outside implementation", (context) => {
    const source = `${plan({second: false, prerequisites: false})}\n## References\n\n### Step 99: Example only\n`;
    assert.deepEqual(parsePlan(source).prerequisites, []);
    assert.deepEqual(parsePlan(source).steps.map((step) => step.id), ["first"]);

    const {repo, path} = setup(context, {second: false, prerequisites: false});
    assert.equal(command(repo, path, "init").status, 0);
    assert.equal(command(repo, path, "begin", {step: "first", mode: "execute"}).status, 0);
});

test("init creates a compact readable state", (context) => {
    const {repo, path} = setup(context);

    const initialized = command(repo, path, "init");
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.deepEqual(JSON.parse(initialized.stdout), {
        ok: true,
        changed: true,
        stateFile: "specs/plans/demo/state.json",
    });
    const state = JSON.parse(readFileSync(join(repo, "specs/plans/demo/state.json"), "utf8"));
    assert.deepEqual(Object.keys(state), ["schemaVersion", "specHash", "planHash", "currentStep", "prerequisites", "steps", "validation"]);
    assert.deepEqual(Object.keys(state.steps), ["first", "second"]);
    assert.equal(validateState(state).length, 0);

    const read = JSON.parse(command(repo, path, "read", {step: "first"}).stdout);
    assert.equal(read.mode, "execute");
    assert.equal(read.firstPendingStep, "first");
    assert.deepEqual(read.selectedStep.criterionIds, ["SC-001"]);
    assert.deepEqual(read.prerequisiteResults, {});
    assert.equal("validationResults" in read, false);
    assert.equal("patchContext" in state, false);
    assert.equal("revision" in state, false);
});

test("sequential lifecycle completes two steps and final validation", (context) => {
    const {repo, path} = setup(context);
    assert.equal(command(repo, path, "init").status, 0);
    assert.equal(command(repo, path, "record", {scope: "prerequisites", checks: checks(["PRE-001"])}).status, 0);

    assert.equal(command(repo, path, "begin", {step: "first", mode: "execute"}).status, 0);
    assert.equal(command(repo, path, "begin", {step: "second", mode: "execute"}).status, 1);
    assert.equal(command(repo, path, "finish", {step: "first", outcome: "completed", checks: checks(["SC-001"])}).status, 0);

    assert.equal(command(repo, path, "begin", {step: "second", mode: "execute"}).status, 0);
    assert.equal(command(repo, path, "finish", {
        step: "second",
        outcome: "partial",
        checks: checks(["SC-002", "failed", "Focused test failed"]),
    }).status, 0);
    assert.equal(command(repo, path, "begin", {step: "second", mode: "execute"}).status, 0);
    assert.equal(command(repo, path, "finish", {step: "second", outcome: "completed", checks: checks(["SC-002"])}).status, 0);
    assert.equal(command(repo, path, "record", {scope: "validation", checks: checks(["VAL-001"])}).status, 0);

    const read = JSON.parse(command(repo, path, "read").stdout);
    assert.equal(read.mode, "complete");
    assert.equal(read.complete, true);
    assert.deepEqual(Object.keys(read.validationResults), ["VAL-001"]);
    assert.equal("prerequisiteResults" in read, false);
    assert.deepEqual(read.steps.map((step) => step.attempt), [1, 2]);

    assert.equal(command(repo, path, "record", {
        scope: "prerequisites",
        checks: checks(["PRE-001", "failed", "Environment changed"]),
    }).status, 0);
    assert.equal(JSON.parse(command(repo, path, "read").stdout).validationComplete, false);
    assert.equal(command(repo, path, "record", {scope: "validation", checks: checks(["VAL-001"])}).status, 1);
});

test("finish requires evidence for every stable criterion ID", (context) => {
    const {repo, path} = setup(context, {second: false, extraCriterion: true});
    assert.equal(command(repo, path, "init").status, 0);
    assert.equal(command(repo, path, "record", {scope: "prerequisites", checks: checks(["PRE-001"])}).status, 0);
    assert.equal(command(repo, path, "begin", {step: "first", mode: "execute"}).status, 0);

    const result = command(repo, path, "finish", {step: "first", outcome: "completed", checks: checks(["SC-001"])});

    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error.code, "INVALID_ARGUMENT");
    assert.equal(JSON.parse(readFileSync(join(repo, "specs/plans/demo/state.json"), "utf8")).currentStep, "first");

    const partial = command(repo, path, "finish", {step: "first", outcome: "partial", checks: checks(["SC-001"])});
    assert.equal(partial.status, 1);
    assert.equal(JSON.parse(partial.stderr).error.code, "INVALID_ARGUMENT");
});

test("record requires the complete expected evidence set", (context) => {
    const {repo, path} = setup(context, {second: false, extraPrerequisite: true});
    assert.equal(command(repo, path, "init").status, 0);

    const result = command(repo, path, "record", {scope: "prerequisites", checks: checks(["PRE-001"])});

    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error.code, "INVALID_ARGUMENT");
    assert.match(JSON.parse(result.stderr).error.message, /PRE-002/u);
});

test("repair reopens a completed step without special patch state", (context) => {
    const {repo, path} = setup(context, {second: false});
    assert.equal(command(repo, path, "init").status, 0);
    assert.equal(command(repo, path, "record", {scope: "prerequisites", checks: checks(["PRE-001"])}).status, 0);
    assert.equal(command(repo, path, "begin", {step: "first", mode: "execute"}).status, 0);
    assert.equal(command(repo, path, "finish", {step: "first", outcome: "completed", checks: checks(["SC-001"])}).status, 0);

    const repair = command(repo, path, "begin", {step: "first", mode: "repair"});

    assert.equal(repair.status, 0, repair.stderr);
    assert.deepEqual(JSON.parse(repair.stdout), {
        ok: true,
        changed: true,
        currentStep: "first",
        attempt: 2,
    });
    const state = JSON.parse(readFileSync(join(repo, "specs/plans/demo/state.json"), "utf8"));
    assert.equal(state.steps.first.outcome, null);
});

test("spec and plan hashes make synchronization explicit", (context) => {
    const {repo, path} = setup(context, {second: false});
    assert.equal(command(repo, path, "init").status, 0);
    write(repo, "specs/demo.md", specification(" Updated intent."));
    assert.equal(JSON.parse(command(repo, path, "read").stdout).mode, "spec-changed");
    assert.equal(command(repo, path, "sync-plan", {affected: "none"}).status, 0);

    write(repo, "specs/plans/demo/plan.md", plan({second: false, extraCriterion: true}));
    assert.equal(JSON.parse(command(repo, path, "read").stdout).mode, "plan-changed");
    const synced = command(repo, path, "sync-plan", {affected: "first"});
    assert.equal(synced.status, 0, synced.stderr);
    assert.equal(JSON.parse(readFileSync(join(repo, "specs/plans/demo/state.json"), "utf8")).steps.first.outcome, null);
    assert.equal(JSON.parse(command(repo, path, "read").stdout).planOutdated, false);
});

test("plan synchronization resets an interrupted step only after hashes change", (context) => {
    const {repo, path} = setup(context, {second: false});
    assert.equal(command(repo, path, "init").status, 0);
    assert.equal(command(repo, path, "record", {scope: "prerequisites", checks: checks(["PRE-001"])}).status, 0);
    assert.equal(command(repo, path, "begin", {step: "first", mode: "execute"}).status, 0);

    const unchanged = command(repo, path, "sync-plan", {affected: "none"});
    assert.equal(unchanged.status, 1);
    assert.equal(JSON.parse(unchanged.stderr).error.code, "INVALID_TRANSITION");

    write(repo, "specs/plans/demo/plan.md", plan({second: false}).replace("Demo plan.", "Updated demo plan."));

    const changed = command(repo, path, "sync-plan", {affected: "none"});

    assert.equal(changed.status, 0, changed.stderr);
    assert.equal(JSON.parse(changed.stdout).abandonedStepId, "first");
    assert.deepEqual(JSON.parse(changed.stdout).resetStepIds, ["first"]);
    assert.equal(JSON.parse(readFileSync(join(repo, "specs/plans/demo/state.json"), "utf8")).currentStep, null);
});

test("corrupt and unsupported state is never rewritten", (context) => {
    const {repo, path} = setup(context, {second: false});
    const statePath = join(repo, "specs/plans/demo/state.json");
    writeFileSync(statePath, "{broken\n");
    assert.equal(JSON.parse(command(repo, path, "read").stderr).error.code, "INVALID_STATE");
    assert.equal(readFileSync(statePath, "utf8"), "{broken\n");

    rmSync(statePath);
    assert.equal(command(repo, path, "init").status, 0);
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    state.schemaVersion = 99;
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
    assert.equal(JSON.parse(command(repo, path, "read").stderr).error.code, "INVALID_STATE");
});

test("runtime validator rejects hidden patch and concurrency fields", () => {
    const errors = validateState({
        schemaVersion: 1,
        specHash: `sha256:${"a".repeat(64)}`,
        planHash: `sha256:${"b".repeat(64)}`,
        currentStep: null,
        prerequisites: {},
        steps: {},
        validation: {},
        revision: 1,
        patchContext: {},
    });
    assert.match(errors.join("; "), /revision|patchContext/u);
});

test("unchanged sync rejects state inconsistent with its plan", (context) => {
    const {repo, path} = setup(context, {second: false});
    assert.equal(command(repo, path, "init").status, 0);
    const statePath = join(repo, "specs/plans/demo/state.json");
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    state.steps.ghost = state.steps.first;
    delete state.steps.first;
    writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

    const result = command(repo, path, "sync-plan", {affected: "none"});

    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error.code, "INVALID_STATE");
});

test("plans with embedded execution state are rejected", (context) => {
    const {repo, path} = setup(context, {second: false});
    writeFileSync(path, plan({second: false}).replace("- **SC-001:** First works.", "- [ ] **SC-001:** First works."));

    const result = command(repo, path, "init");

    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error.code, "INVALID_PLAN");
});
