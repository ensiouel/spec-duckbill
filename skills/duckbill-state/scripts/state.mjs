#!/usr/bin/env node

// Deterministic runtime for the duckbill-state skill.

import {createHash, randomBytes} from "node:crypto";
import {
    closeSync,
    existsSync,
    fsyncSync,
    lstatSync,
    mkdirSync,
    openSync,
    readFileSync,
    realpathSync,
    renameSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import {dirname, isAbsolute, join, relative, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const SCHEMA_VERSION = 1;
const OUTCOMES = ["completed", "partial", "failed"];
const CHECK_RESULTS = ["passed", "failed", "blocked"];
const STATE_FILE = "state.json";

class StateError extends Error {
    constructor(code, message, details = undefined) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

function errorPayload(error) {
    return {
        ok: false,
        error: {
            code: error?.code ?? "INTERNAL_ERROR",
            message: error?.message ?? String(error),
            ...(error?.details === undefined ? {} : {details: error.details}),
        },
    };
}

function hashText(source, ignoredFrontmatterFields = []) {
    const lines = source.replace(/\r\n?/gu, "\n").trimEnd().split("\n");
    if (lines[0] === "---" && ignoredFrontmatterFields.length) {
        const end = lines.indexOf("---", 1);
        if (end >= 0) {
            const ignored = new Set(ignoredFrontmatterFields);
            for (let index = end - 1; index > 0; index -= 1) {
                const field = lines[index].match(/^([A-Za-z][A-Za-z0-9-]*):/u)?.[1];
                if (ignored.has(field)) lines.splice(index, 1);
            }
        }
    }
    return `sha256:${createHash("sha256").update(`${lines.join("\n")}\n`).digest("hex")}`;
}

function inside(root, target) {
    const value = relative(root, target);
    return value !== "" && value !== ".." && !value.startsWith(`..${sep}`) && !isAbsolute(value);
}

function repositoryRoot(requested) {
    const result = spawnSync("git", ["-C", resolve(requested ?? process.cwd()), "rev-parse", "--show-toplevel"], {encoding: "utf8"});
    if (result.status !== 0) throw new StateError("REPOSITORY_NOT_FOUND", result.stderr?.trim() || "cannot find Git repository");
    return realpathSync(result.stdout.trim());
}

function safeFile(root, requested, code) {
    const candidate = resolve(root, requested);
    if (!inside(root, candidate) || !existsSync(candidate) || !statSync(candidate).isFile() || lstatSync(candidate).isSymbolicLink()) {
        throw new StateError(code, `file must be a regular non-symbolic-link file inside the repository: ${requested}`);
    }
    const real = realpathSync(candidate);
    if (!inside(root, real)) throw new StateError(code, `file resolves outside the repository: ${requested}`);
    return real;
}

function frontmatterField(lines, name) {
    if (lines[0] !== "---") return null;
    const end = lines.indexOf("---", 1);
    if (end < 0) return null;
    const pattern = new RegExp(`^${name}:\\s*(.*?)\\s*$`, "u");
    for (const line of lines.slice(1, end)) {
        const match = line.match(pattern);
        if (match) return match[1].replace(/^(["'`])(.*)\1$/u, "$2");
    }
    return null;
}

function headingBlock(lines, heading, endPattern = /^##\s+/u) {
    const start = lines.findIndex((line) => line.trim() === heading);
    if (start < 0) throw new StateError("INVALID_PLAN", `missing ${heading}`);
    let end = start + 1;
    while (end < lines.length && !endPattern.test(lines[end])) end += 1;
    return {start: start + 1, end};
}

function definitionIds(lines, start, end, prefix, label, allowEmpty = false) {
    const ids = [];
    const other = [];
    const pattern = new RegExp(`^\\s*-\\s+\\*\\*(${prefix}-[0-9]{3}):\\*\\*\\s+\\S`, "u");
    for (let index = start; index < end; index += 1) {
        const text = lines[index].trim();
        if (!text) continue;
        if (!/^\s*-\s+/u.test(lines[index])) {
            other.push(text);
            continue;
        }
        const match = lines[index].match(pattern);
        if (!match) throw new StateError("INVALID_PLAN", `${label} item at line ${index + 1} requires a stable ${prefix}-### ID`);
        ids.push(match[1]);
    }
    if (allowEmpty) {
        if (ids.length === 0 && (other.length === 0 || (other.length === 1 && other[0] === "None."))) return ids;
        if (other.length) throw new StateError("INVALID_PLAN", `${label} must contain only ${prefix}-### items or exact None.`);
    }
    if (!allowEmpty && ids.length === 0) throw new StateError("INVALID_PLAN", `${label} must contain at least one item`);
    return ids;
}

export function parsePlan(source) {
    const normalized = source.replace(/\r\n?/gu, "\n");
    const lines = normalized.split("\n");
    if (/^\s*-\s+\[[ xX]\]\s+/mu.test(normalized) || /^##\s+Execution State\s*$/mu.test(normalized) || /^\*\*Execution:\*\*\s*$/mu.test(normalized)) {
        throw new StateError("INVALID_PLAN", "plan must not contain checkboxes or embedded execution state");
    }
    const specFile = frontmatterField(lines, "spec-file");
    if (!specFile) throw new StateError("INVALID_PLAN", "plan frontmatter requires spec-file");
    const prerequisitesBlock = headingBlock(lines, "## Prerequisites");
    const validationBlock = headingBlock(lines, "## Validation Checklist");
    const prerequisites = definitionIds(lines, prerequisitesBlock.start, prerequisitesBlock.end, "PRE", "Prerequisite", true);
    const validation = definitionIds(lines, validationBlock.start, validationBlock.end, "VAL", "Validation");
    const implementationBlock = headingBlock(lines, "## Implementation Steps");
    const starts = [];
    for (let index = implementationBlock.start; index < implementationBlock.end; index += 1) {
        if (/^###\s+Step\s+\d+:/u.test(lines[index])) starts.push(index);
    }
    if (starts.length === 0) throw new StateError("INVALID_PLAN", "plan requires at least one implementation step");
    const steps = starts.map((start, position) => {
        let end = position + 1 < starts.length ? starts[position + 1] : implementationBlock.end;
        for (let index = start + 1; index < end; index += 1) {
            if (/^##\s+/u.test(lines[index])) {
                end = index;
                break;
            }
        }
        const idLine = lines.slice(start + 1, end).find((line) => /^\*\*ID:\*\*/u.test(line));
        const id = idLine?.match(/^\*\*ID:\*\*\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/u)?.[1] ?? null;
        if (!id) throw new StateError("INVALID_PLAN", `step ${position + 1} requires a stable kebab-case ID`);
        const criteriaHeading = lines.findIndex((line, index) => index > start && index < end && line.trim() === "**Success Criteria:**");
        if (criteriaHeading < 0) throw new StateError("INVALID_PLAN", `${id} requires Success Criteria`);
        let criteriaEnd = criteriaHeading + 1;
        while (criteriaEnd < end && !/^\*\*[^*]+:\*\*/u.test(lines[criteriaEnd]) && !/^#{1,3}\s+/u.test(lines[criteriaEnd])) criteriaEnd += 1;
        const criteria = definitionIds(lines, criteriaHeading + 1, criteriaEnd, "SC", `${id} Success Criterion`);
        return {id, criteria};
    });
    const allIds = [...prerequisites, ...validation, ...steps.flatMap((step) => [step.id, ...step.criteria])];
    if (new Set(allIds).size !== allIds.length) throw new StateError("INVALID_PLAN", "plan IDs must be unique");
    return {specFile, prerequisites, validation, steps, hash: hashText(normalized, ["spec-file"])};
}

function parseArgs(argv) {
    const [command, ...rest] = argv;
    const options = {};
    for (let index = 0; index < rest.length; index += 2) {
        const key = rest[index];
        const value = rest[index + 1];
        if (!key?.startsWith("--") || value === undefined) throw new StateError("INVALID_ARGUMENT", `invalid argument: ${key ?? "missing"}`);
        const name = key.slice(2);
        if (options[name] !== undefined) throw new StateError("INVALID_ARGUMENT", `duplicate option: ${key}`);
        options[name] = value;
    }
    return {command, options};
}

function required(options, name) {
    if (options[name] === undefined) throw new StateError("INVALID_ARGUMENT", `missing --${name} <value>`);
    return options[name];
}

function jsonOption(options, name) {
    try {
        return JSON.parse(required(options, name));
    } catch (error) {
        if (error instanceof StateError) throw error;
        throw new StateError("INVALID_ARGUMENT", `invalid JSON for --${name}: ${error.message}`);
    }
}

function plainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactFields(value, allowed, path, errors) {
    for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path} has unknown field: ${key}`);
    for (const key of allowed) if (!(key in value)) errors.push(`${path} is missing field: ${key}`);
}

function validateCheckMap(value, path, errors) {
    if (!plainObject(value)) {
        errors.push(`${path} must be an object`);
        return;
    }
    for (const [id, check] of Object.entries(value)) {
        if (!plainObject(check)) {
            errors.push(`${path}.${id} must be an object`);
            continue;
        }
        exactFields(check, ["result", "evidence"], `${path}.${id}`, errors);
        if (!CHECK_RESULTS.includes(check.result)) errors.push(`${path}.${id}.result is invalid`);
        if (typeof check.evidence !== "string" || !check.evidence.trim()) errors.push(`${path}.${id}.evidence is required`);
    }
}

export function validateState(state) {
    const errors = [];
    if (!plainObject(state)) return ["state must be an object"];
    exactFields(state, ["schemaVersion", "specHash", "planHash", "currentStep", "prerequisites", "steps", "validation"], "state", errors);
    if (state.schemaVersion !== SCHEMA_VERSION) errors.push(`unsupported schemaVersion: ${state.schemaVersion}`);
    for (const field of ["specHash", "planHash"]) {
        if (!/^sha256:[0-9a-f]{64}$/u.test(state[field] ?? "")) errors.push(`${field} must be a sha256 hash`);
    }
    if (state.currentStep !== null && typeof state.currentStep !== "string") errors.push("currentStep must be a string or null");
    validateCheckMap(state.prerequisites, "prerequisites", errors);
    validateCheckMap(state.validation, "validation", errors);
    if (!plainObject(state.steps)) {
        errors.push("steps must be an object");
    } else {
        for (const [id, step] of Object.entries(state.steps)) {
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id) || !plainObject(step)) {
                errors.push(`steps.${id} is invalid`);
                continue;
            }
            exactFields(step, ["attempt", "outcome", "checks"], `steps.${id}`, errors);
            if (!Number.isInteger(step.attempt) || step.attempt < 0) errors.push(`steps.${id}.attempt must be a non-negative integer`);
            if (step.outcome !== null && !OUTCOMES.includes(step.outcome)) errors.push(`steps.${id}.outcome is invalid`);
            if (step.attempt === 0 && step.outcome !== null) errors.push(`steps.${id} cannot have an outcome before its first attempt`);
            validateCheckMap(step.checks, `steps.${id}.checks`, errors);
            if (step.outcome === null && plainObject(step.checks) && Object.keys(step.checks).length) {
                errors.push(`steps.${id} cannot have checks without an outcome`);
            }
        }
    }
    if (typeof state.currentStep === "string" && !state.steps?.[state.currentStep]) errors.push("currentStep must reference a state step");
    if (typeof state.currentStep === "string" && state.steps?.[state.currentStep]?.outcome !== null) errors.push("currentStep outcome must be null");
    if (typeof state.currentStep === "string" && (state.steps?.[state.currentStep]?.attempt ?? 0) < 1) {
        errors.push("currentStep must reference a started attempt");
    }
    return errors;
}

function statePath(planPath) {
    return join(dirname(planPath), STATE_FILE);
}

function readState(path, requiredState = true) {
    if (!existsSync(path)) {
        if (requiredState) throw new StateError("STATE_NOT_FOUND", `state does not exist: ${path}`);
        return null;
    }
    if (lstatSync(path).isSymbolicLink() || !statSync(path).isFile()) throw new StateError("INVALID_STATE", "state path must be a regular file");
    let state;
    try {
        state = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
        throw new StateError("INVALID_STATE", `cannot parse state: ${error.message}`);
    }
    const errors = validateState(state);
    if (errors.length) throw new StateError("INVALID_STATE", "state validation failed", {errors});
    return state;
}

function atomicWrite(path, value) {
    const errors = validateState(value);
    if (errors.length) throw new StateError("INVALID_STATE", "refusing to write invalid state", {errors});
    mkdirSync(dirname(path), {recursive: true});
    const temporary = `${path}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`;
    let descriptor;
    try {
        descriptor = openSync(temporary, "wx");
        writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
        fsyncSync(descriptor);
        closeSync(descriptor);
        descriptor = undefined;
        renameSync(temporary, path);
    } finally {
        if (descriptor !== undefined) closeSync(descriptor);
        rmSync(temporary, {force: true});
    }
}

function loadWorkflow(planPath, repoRoot, requireState = true) {
    const planSource = readFileSync(planPath, "utf8");
    const plan = parsePlan(planSource);
    const specPath = safeFile(repoRoot, plan.specFile, "SPECIFICATION_NOT_FOUND");
    const specHash = hashText(readFileSync(specPath, "utf8"), ["plan-file"]);
    const path = statePath(planPath);
    const state = readState(path, requireState);
    return {plan, specHash, path, state};
}

function passed(ids, records) {
    return ids.every((id) => records[id]?.result === "passed");
}

function consistencyErrors(plan, state) {
    const errors = [];
    const stepIds = plan.steps.map((step) => step.id);
    if (new Set(Object.keys(state.steps)).size !== stepIds.length || stepIds.some((id) => !state.steps[id])) errors.push("state step IDs do not match the current plan");
    for (const id of Object.keys(state.prerequisites)) if (!plan.prerequisites.includes(id)) errors.push(`unknown prerequisite result: ${id}`);
    for (const id of Object.keys(state.validation)) if (!plan.validation.includes(id)) errors.push(`unknown validation result: ${id}`);
    for (const step of plan.steps) {
        const record = state.steps[step.id];
        if (!record) continue;
        for (const id of Object.keys(record.checks)) if (!step.criteria.includes(id)) errors.push(`unknown criterion result: ${step.id}/${id}`);
        if (record.outcome === "completed" && !passed(step.criteria, record.checks)) errors.push(`completed step has incomplete checks: ${step.id}`);
    }
    return errors;
}

function summary(workflow, selectedId = null) {
    const {plan, specHash, state} = workflow;
    const planOutdated = state.planHash !== plan.hash;
    const specOutdated = state.specHash !== specHash;
    if (!planOutdated) {
        const errors = consistencyErrors(plan, state);
        if (errors.length) throw new StateError("INVALID_STATE", "state is inconsistent with the current plan", {errors});
    }
    const steps = plan.steps.map((step) => {
        const record = state.steps[step.id] ?? {attempt: 0, outcome: null, checks: {}};
        const status = state.currentStep === step.id ? "running" : record.outcome ?? "pending";
        return {id: step.id, status, attempt: record.attempt};
    });
    const firstPendingStep = steps.find((step) => step.status !== "completed")?.id ?? null;
    const prerequisitesComplete = !planOutdated && passed(plan.prerequisites, state.prerequisites);
    const validationComplete = !planOutdated && !specOutdated && passed(plan.validation, state.validation);
    const allStepsComplete = steps.every((step) => step.status === "completed");
    const complete = !planOutdated && !specOutdated && prerequisitesComplete && allStepsComplete && validationComplete;
    const mode = planOutdated ? "plan-changed" : specOutdated ? "spec-changed" : firstPendingStep ? "execute" : complete ? "complete" : "validation";
    const selectedPlan = selectedId ? plan.steps.find((step) => step.id === selectedId) : null;
    if (selectedId && !selectedPlan) throw new StateError("STEP_NOT_FOUND", `unknown step: ${selectedId}`);
    return {
        ok: true,
        mode,
        specOutdated,
        planOutdated,
        currentStep: state.currentStep,
        firstPendingStep,
        prerequisitesComplete,
        validationComplete,
        complete,
        steps,
        ...(selectedPlan ? {
            prerequisiteResults: state.prerequisites,
            selectedStep: {
                id: selectedId,
                criterionIds: selectedPlan.criteria,
                ...state.steps[selectedId],
            },
        } : {}),
        ...(["validation", "complete"].includes(mode) ? {validationResults: state.validation} : {}),
    };
}

function createState(plan, specHash) {
    return {
        schemaVersion: SCHEMA_VERSION,
        specHash,
        planHash: plan.hash,
        currentStep: null,
        prerequisites: {},
        steps: Object.fromEntries(plan.steps.map((step) => [step.id, {attempt: 0, outcome: null, checks: {}}])),
        validation: {},
    };
}

function requireCurrent(workflow) {
    if (workflow.state.planHash !== workflow.plan.hash) throw new StateError("PLAN_CHANGED", "plan changed; run sync-plan first");
    if (workflow.state.specHash !== workflow.specHash) throw new StateError("SPEC_CHANGED", "specification changed; synchronize the plan first");
    const errors = consistencyErrors(workflow.plan, workflow.state);
    if (errors.length) throw new StateError("INVALID_STATE", "state is inconsistent with the current plan", {errors});
}

function normalizeChecks(value, allowedIds) {
    if (!Array.isArray(value)) throw new StateError("INVALID_ARGUMENT", "checks must be a JSON array");
    const allowed = new Set(allowedIds);
    const checks = {};
    for (const item of value) {
        if (!allowed.has(item?.id)) throw new StateError("INVALID_ARGUMENT", `unknown check ID: ${item?.id}`);
        if (checks[item.id]) throw new StateError("INVALID_ARGUMENT", `duplicate check ID: ${item.id}`);
        if (!CHECK_RESULTS.includes(item.result)) throw new StateError("INVALID_ARGUMENT", `invalid check result: ${item.result}`);
        if (typeof item.evidence !== "string" || !item.evidence.trim()) throw new StateError("INVALID_ARGUMENT", `${item.id} requires evidence`);
        checks[item.id] = {result: item.result, evidence: item.evidence.trim()};
    }
    const missing = allowedIds.filter((id) => !checks[id]);
    if (missing.length) throw new StateError("INVALID_ARGUMENT", `checks must include every expected ID; missing: ${missing.join(", ")}`);
    return checks;
}

function parseAffected(value) {
    if (value === "none") return [];
    const ids = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (ids.length === 0 || new Set(ids).size !== ids.length) throw new StateError("INVALID_ARGUMENT", "--affected requires unique comma-separated IDs or none");
    return ids;
}

export function run(command, options) {
    const repoRoot = repositoryRoot(options.repo ?? dirname(resolve(options.plan ?? ".")));
    const planPath = safeFile(repoRoot, required(options, "plan"), "PLAN_NOT_FOUND");
    if (command === "init") {
        const workflow = loadWorkflow(planPath, repoRoot, false);
        if (workflow.state) throw new StateError("STATE_EXISTS", "state already exists");
        const state = createState(workflow.plan, workflow.specHash);
        atomicWrite(workflow.path, state);
        return {ok: true, changed: true, stateFile: relative(repoRoot, workflow.path)};
    }
    const workflow = loadWorkflow(planPath, repoRoot, true);
    if (command === "read") return summary(workflow, options.step ?? null);
    if (command === "sync-plan") {
        const affected = parseAffected(required(options, "affected"));
        if (workflow.state.planHash === workflow.plan.hash && workflow.state.specHash === workflow.specHash) {
            const errors = consistencyErrors(workflow.plan, workflow.state);
            if (errors.length) throw new StateError("INVALID_STATE", "state is inconsistent with the current plan", {errors});
            if (workflow.state.currentStep !== null) throw new StateError("INVALID_TRANSITION", "finish the current step before synchronizing an unchanged plan");
            if (affected.length) throw new StateError("INVALID_TRANSITION", "cannot reset affected steps when plan and specification are unchanged");
            return {ok: true, changed: false, abandonedStepId: null, resetStepIds: []};
        }
        const known = new Set([...Object.keys(workflow.state.steps), ...workflow.plan.steps.map((step) => step.id)]);
        for (const id of affected) if (!known.has(id)) throw new StateError("INVALID_ARGUMENT", `unknown affected step: ${id}`);
        const abandonedStepId = workflow.state.currentStep;
        const affectedSet = new Set([...affected, ...(abandonedStepId ? [abandonedStepId] : [])]);
        const next = structuredClone(workflow.state);
        next.specHash = workflow.specHash;
        next.planHash = workflow.plan.hash;
        next.currentStep = null;
        next.prerequisites = Object.fromEntries(Object.entries(next.prerequisites).filter(([id]) => workflow.plan.prerequisites.includes(id)));
        next.validation = {};
        next.steps = Object.fromEntries(workflow.plan.steps.map((step) => {
            const previous = next.steps[step.id] ?? {attempt: 0, outcome: null, checks: {}};
            const checks = Object.fromEntries(Object.entries(previous.checks).filter(([id]) => step.criteria.includes(id)));
            const reset = affectedSet.has(step.id) || (previous.outcome === "completed" && !passed(step.criteria, checks));
            return [step.id, {
                attempt: previous.attempt,
                outcome: reset ? null : previous.outcome,
                checks: reset ? {} : checks,
            }];
        }));
        atomicWrite(workflow.path, next);
        return {
            ok: true,
            changed: true,
            abandonedStepId,
            resetStepIds: workflow.plan.steps
                .filter((step) => affectedSet.has(step.id) || (next.steps[step.id].outcome === null && workflow.state.steps[step.id]?.outcome !== null))
                .map((step) => step.id),
        };
    }
    requireCurrent(workflow);
    const state = structuredClone(workflow.state);
    if (command === "record") {
        if (state.currentStep !== null) throw new StateError("INVALID_TRANSITION", "finish the current step before recording shared checks");
        const scope = required(options, "scope");
        if (!["prerequisites", "validation"].includes(scope)) throw new StateError("INVALID_ARGUMENT", "scope must be prerequisites or validation");
        if (scope === "validation" && workflow.plan.steps.some((step) => state.steps[step.id].outcome !== "completed")) {
            throw new StateError("INVALID_TRANSITION", "final validation requires every step to be completed");
        }
        if (scope === "validation" && !passed(workflow.plan.prerequisites, state.prerequisites)) {
            throw new StateError("INVALID_TRANSITION", "final validation requires every prerequisite to pass");
        }
        state[scope] = normalizeChecks(jsonOption(options, "checks"), workflow.plan[scope]);
        if (scope === "prerequisites") state.validation = {};
        atomicWrite(workflow.path, state);
        return {ok: true, changed: true, scope, recorded: Object.keys(state[scope]).length};
    }
    if (command === "begin") {
        if (state.currentStep !== null) throw new StateError("INVALID_TRANSITION", `step already running: ${state.currentStep}`);
        if (!passed(workflow.plan.prerequisites, state.prerequisites)) throw new StateError("INVALID_TRANSITION", "prerequisites are incomplete");
        const stepId = required(options, "step");
        const mode = required(options, "mode");
        if (!["execute", "repair"].includes(mode)) throw new StateError("INVALID_ARGUMENT", "mode must be execute or repair");
        const index = workflow.plan.steps.findIndex((step) => step.id === stepId);
        if (index < 0) throw new StateError("STEP_NOT_FOUND", `unknown step: ${stepId}`);
        const firstPending = workflow.plan.steps.find((step) => state.steps[step.id].outcome !== "completed")?.id ?? null;
        if (mode === "execute" && firstPending !== stepId) throw new StateError("INVALID_TRANSITION", `first pending step is ${firstPending ?? "none"}`);
        if (mode === "repair") {
            if (state.steps[stepId].outcome !== "completed") throw new StateError("INVALID_TRANSITION", "repair requires a completed step");
            const earlier = workflow.plan.steps.slice(0, index).find((step) => state.steps[step.id].outcome !== "completed");
            if (earlier) throw new StateError("INVALID_TRANSITION", `earlier step requires execution: ${earlier.id}`);
        }
        state.steps[stepId].attempt += 1;
        state.steps[stepId].outcome = null;
        state.steps[stepId].checks = {};
        state.currentStep = stepId;
        state.validation = {};
        atomicWrite(workflow.path, state);
        return {ok: true, changed: true, currentStep: stepId, attempt: state.steps[stepId].attempt};
    }
    if (command === "finish") {
        const stepId = required(options, "step");
        const outcome = required(options, "outcome");
        if (state.currentStep !== stepId) throw new StateError("INVALID_TRANSITION", `current step is ${state.currentStep ?? "none"}`);
        if (!OUTCOMES.includes(outcome)) throw new StateError("INVALID_ARGUMENT", `invalid outcome: ${outcome}`);
        const step = workflow.plan.steps.find((item) => item.id === stepId);
        const checks = normalizeChecks(jsonOption(options, "checks"), step.criteria);
        const allPassed = passed(step.criteria, checks);
        if (outcome === "completed" && !allPassed) throw new StateError("INVALID_TRANSITION", "completed outcome requires every criterion to pass");
        if (outcome !== "completed" && allPassed) throw new StateError("INVALID_TRANSITION", `${outcome} outcome cannot have every criterion passing`);
        state.steps[stepId].outcome = outcome;
        state.steps[stepId].checks = checks;
        state.currentStep = null;
        atomicWrite(workflow.path, state);
        return {ok: true, changed: true, step: stepId, outcome};
    }
    throw new StateError("INVALID_ARGUMENT", "usage: state.mjs read|init|sync-plan|record|begin|finish --plan <path> [options]");
}

function main(argv) {
    const {command, options} = parseArgs(argv);
    const output = run(command, options);
    process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        main(process.argv.slice(2));
    } catch (error) {
        process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
        process.exitCode = 1;
    }
}
