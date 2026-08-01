import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

const paths = {
    init: "prompts/duck-init.md",
    spec: "prompts/duck-spec.md",
    plan: "prompts/duck-plan.md",
    refineSpec: "prompts/duck-refine-spec.md",
    refinePlan: "prompts/duck-refine-plan.md",
    execute: "prompts/duck-execute.md",
    refineCode: "prompts/duck-refine-code.md",
    planAuthor: "skills/duckbill-plan-author/SKILL.md",
    planRefiner: "skills/duckbill-plan-refiner/SKILL.md",
    executor: "skills/duckbill-step-executor/SKILL.md",
    codeRefiner: "skills/duckbill-code-refiner/SKILL.md",
    stateSkill: "skills/duckbill-state/SKILL.md",
    stateCli: "skills/duckbill-state/scripts/state.mjs",
    executionReport: "skills/duckbill-step-executor/references/execution-report.md",
    clarifierPolicy: "skills/duckbill-clarifier/references/clarification-policy.md",
    planFormat: "skills/duckbill-plan-author/references/plan-format.md",
    specFormat: "skills/duckbill-spec-author/references/spec-format.md",
    readme: "README.md",
};

function read(name) {
    return readFileSync(resolve(paths[name] ?? name), "utf8").replace(/\r\n?/gu, "\n");
}

function compact(name) {
    return read(name).replace(/\s+/gu, " ");
}

function includesAll(name, values) {
    const source = compact(name);
    for (const value of values) assert.ok(source.includes(value), `${paths[name] ?? name}: missing ${JSON.stringify(value)}`);
}

function matchesAll(name, patterns) {
    const source = compact(name);
    for (const pattern of patterns) assert.match(source, pattern, paths[name] ?? name);
}

const promptNames = ["init", "spec", "plan", "refineSpec", "refinePlan", "execute", "refineCode"];

test("all prompts preserve the exact three-line result contract", () => {
    for (const name of promptNames) {
        const match = read(name).match(/Output MUST be exactly three lines, in order, with nothing else:\n\n```text\n([\s\S]*?)```/u);
        assert.ok(match, `${name}: missing result block`);
        assert.deepEqual(match[1].trim().split("\n").map((line) => line.split(":", 1)[0]), ["Changed", "Status", "Next"]);
    }
});

test("README documents the user workflow and commands", () => {
    includesAll("readme", [
        "pi install https://github.com/ensiouel/spec-duckbill",
        "/duck-init",
        "/duck-spec",
        "/duck-plan",
        "/duck-execute",
        "/duck-refine-spec",
        "/duck-refine-plan",
        "/duck-refine-code",
        "Changed:",
        "Status:",
        "Next:",
    ]);
    matchesAll("readme", [/one step at a time/i, /never starts the next step automatically/i, /Keep `state\.json` in Git/i]);
});

test("specification, plan, and state boundaries have canonical internal documentation", () => {
    matchesAll("specFormat", [/Specification intent owns scope, required behavior\/constraints/i]);
    matchesAll("planFormat", [/The plan owns approach, scope/i, /state\.json` stores only progress and evidence/i]);
    matchesAll("stateSkill", [/only source of truth for state shape, enums, transitions, validation, and persistence/i]);
});

test("plan definitions use stable IDs and contain no operational state", () => {
    includesAll("planFormat", ["PRE-###", "SC-###", "VAL-###", "globally unique"]);
    matchesAll("planAuthor", [/plain bullets/i, /MUST NOT write checkboxes or result records/i]);
    matchesAll("planFormat", [/MUST NOT contain checkboxes, status, Attempt, evidence, Execution sections/i]);
    assert.doesNotMatch(read("planFormat"), /- \[[ xX]\] <Condition/u);
});

test("plan creation initializes state only after plan validation", () => {
    includesAll("plan", ["state CLI `init`", "unsupported plan format"]);
    matchesAll("plan", [/Initialize state only after plan validation/i, /Never leave a new plan without valid state/i]);
});

test("normal state API is a small sequential protocol", () => {
    assert.equal(existsSync(resolve(paths.stateSkill)), true);
    includesAll("stateSkill", [
        "`read [--step <step-id>]`",
        "`init`",
        "`record --scope <prerequisites|validation> --checks <json-array>`",
        "`begin --step <step-id> --mode <execute|repair>`",
        "`finish --step <step-id> --outcome <completed|partial|failed> --checks <json-array>`",
        "`sync-plan --affected <comma-separated-step-ids|none>`",
    ]);
    matchesAll("stateSkill", [/bundled CLI as the only interface/i, /MUST NOT infer semantic evidence, affected IDs, ownership, routing/i]);
    assert.match(read("stateCli"), /usage: state\.mjs read\|init\|sync-plan\|record\|begin\|finish/u);
    assert.doesNotMatch(read("stateCli"), /expected-revision|begin-attempt|finish-attempt|build-patch|reconcile-plan/u);
});

test("stateful commands load the state adapter without sharing it with semantic workers", () => {
    for (const name of ["plan", "refinePlan", "execute", "refineCode"]) {
        matchesAll(name, [/Load `duckbill-state` independently/i, /bundled deterministic CLI/i]);
    }
    matchesAll("stateSkill", [/MUST NOT invoke or return data to another skill/i, /calling command supplies explicit typed arguments/i]);
});

test("execution and repair use begin, finish, and stable evidence IDs", () => {
    includesAll("execute", ["begin --mode execute", "state CLI `finish`", "{id,result,evidence}", "SC-###", "VAL-###"]);
    includesAll("refineCode", ["begin --mode repair", "state CLI `finish`", "{id,result,evidence}"]);
    assert.doesNotMatch(`${read("execute")}\n${read("refineCode")}`, /\b(?:patch|revision|lock|baseline|begin-attempt|finish-attempt)\b/u);
});

test("plan refinement is the only semantic source of affected step IDs", () => {
    includesAll("refinePlan", ["sync-plan --affected <step-ids|none>", "affected step IDs"]);
    matchesAll("planRefiner", [/Return affected step IDs and changed definition IDs/i, /do not receive or inspect workflow state/i]);
    matchesAll("refinePlan", [/If `currentStep` is set.*hashes are current.*route to/i, /Never hand-edit `state\.json`/i]);
});

test("specification refinement leaves state opaque and unchanged", () => {
    matchesAll("refineSpec", [/MAY change only the selected specification/i, /do not interpret state/i, /do not persist that derived status/i]);
    assert.doesNotMatch(read("refineSpec"), /state CLI|state\.mjs|state `read`|state `sync/u);
});

test("semantic workers cannot read workflow state or invoke workers", () => {
    for (const name of ["executor", "codeRefiner"]) {
        matchesAll(name, [/MUST NOT read or change `state\.json`/i, /MUST NOT invoke another worker/i]);
    }
    matchesAll("planRefiner", [/do not receive or inspect workflow state/i, /MUST NOT invoke another worker/i]);
    for (const name of ["plan", "refineSpec", "refinePlan", "execute", "refineCode"]) {
        matchesAll(name, [/sole orchestrator/i]);
    }
});

test("semantic workers receive resolved user input without another skill report", () => {
    for (const name of ["spec", "plan", "refineSpec", "refinePlan", "execute", "refineCode"]) {
        matchesAll(name, [/resolved user input/i, /direct user answers/i, /never .*another (?:skill|worker)'s report/i]);
    }
    matchesAll("execute", [/Load `duckbill-step-executor`.*using only canonical artifacts and resolved user input/i]);
    matchesAll("plan", [/load `duckbill-plan-author`.*specification, verified project facts, and resolved user input/i]);
    matchesAll("refinePlan", [/load `duckbill-plan-refiner`.*using only canonical artifacts and resolved user input/i]);
    matchesAll("refineSpec", [/load `duckbill-spec-refiner`.*using only canonical artifacts and resolved user input/i]);
});

test("executor preflight cannot reach mutation steps", () => {
    matchesAll("executor", [/Preflight.*procedure steps 1–3.*MUST NOT perform Actions/i]);
    assert.doesNotMatch(read("executor"), /Preflight.*steps 1–4/u);
});

test("failed attempts still produce complete criterion evidence", () => {
    for (const name of ["execute", "refineCode"]) {
        matchesAll(name, [
            /complete `SC-###` result set/i,
            /higher-level mismatch.*after `begin`.*unevaluated criterion `blocked`.*`finish` with `failed`/i,
        ]);
    }
});

test("prompts invoke the state CLI without restating its transition internals", () => {
    assert.doesNotMatch(read("refinePlan"), /It updates hashes|adds\/removes plan steps|resets affected|filters retired check results|reset that interrupted attempt/u);
    assert.doesNotMatch(read("execute"), /The CLI rejects `completed`|state revisions|event logs|baselines/u);
});

test("validation mode enters final validation without a finish transition", () => {
    matchesAll("execute", [/Enter this step either directly from `validation` mode or after `finish`/i]);
});

test("architecture ownership distinguishes high-level design from implementation", () => {
    matchesAll("clarifierPolicy", [/plan.*implementation approach\/architecture/i]);
    assert.doesNotMatch(read("clarifierPolicy"), /\| plan \| architecture,/u);
});

test("state validates every object immediately before atomic write", () => {
    matchesAll("stateCli", [/function atomicWrite\(path, value\).*validateState\(value\).*refusing to write invalid state/i]);
});

test("orchestration alone owns final plan validation", () => {
    matchesAll("execute", [/orchestration itself.*every `VAL-###`/i, /No semantic worker decides whether final validation is due/i]);
    matchesAll("refineCode", [/orchestration itself runs and records the full `VAL-###` set/i]);
    for (const name of ["executor", "codeRefiner", "executionReport"]) {
        assert.doesNotMatch(read(name), /Plan Validation|final Validation Checklist|final checklist item|\bVAL-\d/u);
    }
});

test("execution resumes from canonical files and a compact state read", () => {
    matchesAll("execute", [
        /Require canonical `specs\/plans\/<name>\/plan\.md`/i,
        /Read state for the selected step/i,
        /selected `currentStep` resumes its existing attempt/i,
    ]);
    matchesAll("stateCli", [
        /function summary\(workflow, selectedId = null\)/i,
        /selectedStep: \{.*criterionIds: selectedPlan\.criteria/i,
    ]);
});
