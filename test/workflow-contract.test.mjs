import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
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
    planFormat: "skills/duckbill-plan-author/references/plan-format.md",
    specFormat: "skills/duckbill-spec-author/references/spec-format.md",
    refinementGuide: "skills/duckbill-plan-refiner/references/refinement-guide.md",
    executionReport: "skills/duckbill-step-executor/references/execution-report.md",
    patchSkill: "skills/duckbill-step-patch/SKILL.md",
    readme: "README.md",
};

function read(name) {
    return readFileSync(resolve(paths[name] ?? name), "utf8");
}

function compact(name) {
    return read(name).replace(/\s+/gu, " ");
}

function includesAll(name, values) {
    const document = compact(name);
    for (const value of values) {
        assert.ok(document.includes(value), `${paths[name] ?? name}: missing ${JSON.stringify(value)}`);
    }
}

function matchesAll(name, patterns) {
    const document = compact(name);
    for (const pattern of patterns) assert.match(document, pattern, paths[name] ?? name);
}

test("scenario 1: specification creation owns only the specification level", () => {
    matchesAll("init", [/do not\s+derive the path|MUST NOT derive the path/i, /MUST NOT create a plan, execution state, patch, or implementation code/]);
    matchesAll("spec", [/write only specification intent|MAY change only the selected specification/i, /do not create plan intent, execution state, patches|MUST NOT create plan intent, execution state, patches/i]);
    matchesAll("spec", [/Status: ready; specification intent verified/, /Next: \/duck-plan <spec-file>/]);
});

test("scenario 2: new plan creation preserves specification and starts without execution state", () => {
    matchesAll("plan", [
        /change(?:s)? only the plan level/i,
        /specification.*implementation code.*read-only/i,
        /no `?Execution State`? or `?Execution`? blocks|MUST NOT contain `Execution State` or per-step `Execution` blocks/i,
    ]);
    matchesAll("plan", [/Status: ready; plan intent verified and execution state not created/, /Next: \/duck-execute/]);
});

test("scenario 3: execution implements exactly one first executable step", () => {
    matchesAll("execute", [
        /Execute exactly one (?:implementation )?plan step/i,
        /first step in plan order/i,
        /implement only the selected step/i,
        /(?:Never|MUST NOT) divide or overwrite another step's patch/i,
    ]);
    assert.doesNotMatch(read("execute"), /execute (?:the )?next step/iu);
});

test("scenario 4: specification refinement changes no downstream artifact", () => {
    matchesAll("refineSpec", [
        /Refine specification intent only|MAY change only specification intent/i,
        /plan intent, execution state, patches, and implementation code.*read-only|MUST preserve `plan-file`, plan intent, execution state, patches, and implementation code/i,
        /do not mark any step `stale`|MUST NOT mark a step `stale`/i,
        /linked plan, all execution state, patches, and implementation code (?:are )?byte-for-byte unchanged/i,
    ]);
    includesAll("refineSpec", ["/duck-refine-plan <plan-file> whole Synchronize with the updated specification"]);
});

test("scenario 5: plan refinement may stale only affected executed steps", () => {
    matchesAll("refinePlan", [
        /may update plan intent and execution state|MAY change plan intent and the execution state needed to keep evidence truthful/i,
        /Mark an affected executed step `stale`|mark each `stale`/i,
        /uncheck only evidence (?:no longer proving|invalidated by)/i,
        /first affected.*`\/duck-execute`/i,
    ]);
    matchesAll("refinementGuide", [/Preserve unchanged criteria and execution records|Preserve unrelated state/i, /specification change alone never makes execution state stale|Specification refinement alone never stales state/i]);
});

test("scenario 6: a completed-step code defect uses code refinement", () => {
    matchesAll("refineCode", [
        /Require (?:that )?the selected step (?:to )?(?:has|have).*`Status: completed`/i,
        /`code defect`.*specification.*plan intent|code defect already governed by specification and plan intent/i,
        /MUST NOT (?:modify plan intent|change specification intent or plan intent)/i,
    ]);
    matchesAll("refinePlan", [/plan intent is correct, completed implementation requires correction/, /\/duck-refine-code/]);
});

test("scenario 7: specification feedback sent to a code command routes upward without writes", () => {
    includesAll("refineCode", [
        "specification-level change",
        "blocked; requested change belongs in the specification",
        "/duck-refine-spec <spec-file> <normalized feedback>",
    ]);
});

test("scenario 8: plan feedback sent to a code command routes to plan refinement", () => {
    includesAll("refineCode", ["plan-level change", "blocked; requested change belongs in the plan"]);
    matchesAll("refineCode", [/\/duck-refine-plan <plan-file> <step-id(?:\|whole|-or-whole)> <normalized feedback>/]);
});

test("scenario 9: material unknowns stop before mutation", () => {
    for (const name of ["spec", "plan", "refineSpec", "refinePlan", "execute", "refineCode"]) {
        matchesAll(name, [/material unknown/i, /before (?:any |all |the first )?(?:writ(?:e|es|ing)|mutation)|before writes/i]);
    }
});

test("scenario 10: blocked and routed outcomes preserve files and state", () => {
    matchesAll("spec", [/Changed: none/, /do not create plan intent|MUST NOT create plan intent/i]);
    matchesAll("plan", [/Changed: none/, /Do not edit the specification|MUST NOT edit the specification/i]);
    for (const name of ["refineSpec", "refinePlan", "execute", "refineCode"]) {
        matchesAll(name, [/Changed: none/, /byte-for-byte unchanged|Every blocked or routed result preserves.*byte-for-byte|leave all files and execution state unchanged|MUST NOT modify specification intent, plan intent/]);
    }
});

test("scenario 11: new work after plan refinement routes to execution", () => {
    matchesAll("refinePlan", [/plan (?:intent )?changed.*\/duck-execute/i]);
    matchesAll("planFormat", [/(?:new|unexecuted).*`partial`.*`failed`.*`stale`.*`\/duck-execute`/i]);
});

test("scenario 12: stale work is execution work, never code repair", () => {
    matchesAll("refineCode", [/(?:new|unexecuted).*`partial`.*`failed`.*`stale`.*`\/duck-execute`/i]);
    matchesAll("planFormat", [/Only `\/duck-refine-plan` (?:sets an existing execution record to `Status: stale`|MAY set `stale`)/]);
});

test("scenario 13: final validation runs after the last step and routes every failure owner", () => {
    matchesAll("execute", [/last step.*final Validation Checklist|last implementation step.*final Validation Checklist/i, /Final-validation work MUST NOT cause this command to edit implementation outside the selected step|Final validation MUST NOT edit implementation outside the selected step/i]);
    matchesAll("executionReport", [/Run every checklist item|Run the complete checklist/i, /another (?:uniquely identified|unique) `completed` step/i, /\/duck-execute.*\/duck-refine-code.*\/duck-refine-plan.*\/duck-refine-spec.*Next: none/i]);
});

test("scenario 14: every recommendation is a manual Next action", () => {
    matchesAll("readme", [/recommendation.*`Next`/i, /never invokes it automatically|never run automatically/i]);
    for (const name of ["init", "spec", "plan", "refineSpec", "refinePlan", "execute", "refineCode"]) {
        matchesAll(name, [/Next:/, /never run automatically|Do not invoke.*automatically|Never run.*automatically|no text after them|nothing else/i]);
    }
});

test("all prompts have the exact three-line footer contract", () => {
    for (const name of ["init", "spec", "plan", "refineSpec", "refinePlan", "execute", "refineCode"]) {
        const document = read(name);
        const block = document.match(/Output MUST be exactly three lines, in order, with nothing else:\n\n```text\n([^`]+)```/u);
        if (block) {
            const labels = block[1].trim().split("\n").map((line) => line.split(":", 1)[0]);
            assert.deepEqual(labels, ["Changed", "Status", "Next"], name);
        } else {
            matchesAll(name, [/entire command result MUST contain exactly.*`Changed`.*`Status`.*`Next`.*in that order.*no text before or after/i]);
        }
    }
});

test("plan intent and execution state remain distinct", () => {
    matchesAll("planFormat", [
        /Plan intent (?:defines how to implement the specification|owns implementation approach\/scope)/i,
        /Execution state (?:records what actually happened|owns prerequisite\/criterion\/Validation checkmarks)/i,
        /Prerequisite text(?: and |\/)order (?:are|is) plan intent; (?:prerequisite|its) checkmarks? (?:are|is) execution state/i,
    ]);
    matchesAll("refinePlan", [/Plan intent(?::| includes)/i, /Execution state(?::| includes)/i]);
});

test("reciprocal links are validated and repaired only by authoring owners", () => {
    matchesAll("specFormat", [/`\/duck-refine-spec` preserves `plan-file`|`\/duck-refine-spec` MUST preserve `plan-file`/i, /blocks refinement.*routes to `\/duck-spec`|Refiners MUST NOT repair links/i]);
    matchesAll("planFormat", [/`\/duck-plan` may establish or restore|`\/duck-plan` alone may establish\/restore/i, /Refinement preserves `spec-file`|refinement MUST preserve it/i]);
    for (const name of ["execute", "refineCode"]) {
        includesAll(name, ["governing specification link is invalid", "reciprocal plan link is invalid", "Next: /duck-spec <spec-file>"]);
    }
});

test("stable IDs, mappings, ordering, and isolated patches remain mandatory", () => {
    matchesAll("specFormat", [/Keep an ID when refining the same meaning|Preserve an ID when meaning is unchanged/i, /Never reuse a removed ID|never reuse a removed ID/i]);
    matchesAll("planFormat", [
        /Preserve the ID when.*logical outcome stays the same|Preserve an ID while its logical outcome is unchanged/i,
        /Map requirements directly through each step's `Requirements` field|Map each in-scope ID through a step `Requirements` field/i,
        /the only executable step/i,
    ]);
    matchesAll("patchSkill", [/(?:overwrite|replace) only (?:that step's|its) patch/i, /preserve every other step patch/i]);
});

test("patch recovery preserves implementation and attempt", () => {
    matchesAll("execute", [/patch-recovery mode/i, /changes no implementation file and does not create a new Attempt|MUST NOT change implementation or create an Attempt/i]);
    matchesAll("planFormat", [/patch-recovery mode|MAY enter patch recovery/i, /does not increment Attempt|do not increment Attempt/i]);
});

test("command and persisted status vocabularies stay separate", () => {
    matchesAll("readme", [
        /Command-result.*Status.*draft.*ready.*completed.*partial.*failed.*blocked.*unchanged/i,
        /Persisted step.*Status.*completed.*partial.*failed.*stale/i,
        /`blocked` means the command made no changes|A `blocked` result changes no files or execution state/i,
    ]);
});
