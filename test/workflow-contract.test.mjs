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
    stateCli: "scripts/state.mjs",
    executionReport: "skills/duckbill-step-executor/references/execution-report.md",
    clarifierPolicy: "skills/duckbill-clarifier/references/clarification-policy.md",
    planFormat: "skills/duckbill-plan-author/references/plan-format.md",
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

test("each concern has one documented source of truth", () => {
    matchesAll("readme", [
        /required behavior and decisions.*`specs\/<name>\.md`/i,
        /implementation sequence and proof definitions.*plan\.md/i,
        /current progress and evidence.*state\.json/i,
        /history.*Git/i,
        /not stored twice/i,
    ]);
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
    includesAll("readme", ["`read`", "`init`", "`record`", "`begin`", "`finish`", "`sync-plan`"]);
    matchesAll("readme", [/single writer/i, /no state revisions, locks, event logs, baselines/i, /state CLI is ordinary code/i]);
    assert.equal(existsSync(resolve("skills/duckbill-state/SKILL.md")), false);
    assert.match(read("stateCli"), /usage: state\.mjs read\|init\|sync-plan\|record\|begin\|finish/u);
    assert.doesNotMatch(read("stateCli"), /expected-revision|begin-attempt|finish-attempt|build-patch|reconcile-plan/u);
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
        matchesAll(name, [/resolved user input/i, /direct user answers/i]);
    }
    matchesAll("spec", [/Never pass a clarification report into another skill/i]);
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
        matchesAll(name, [/close the attempt as (?:`failed`|failed) with a complete `SC-###` result set/i, /unevaluated criterion.*`blocked`/i]);
    }
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

test("restart recovery uses canonical files and a compact state read", () => {
    matchesAll("readme", [/new AI session recovers by reading the specification, plan, and compact state summary/i]);
    matchesAll("readme", [/`read` returns a compact summary/i, /when requested, one step's evidence/i]);
});
