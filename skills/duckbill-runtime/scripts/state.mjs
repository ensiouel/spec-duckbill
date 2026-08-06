#!/usr/bin/env node

import {closeSync, existsSync, lstatSync, openSync, readFileSync, rmSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {canonicalFeaturePaths, checkArtifacts, checkFeature, parsePlan, parseSpec, parseTasks} from "./check.mjs";
import {captureRepositorySnapshot, detectEvidenceStaleness, detectRepositoryDrift, validateFeatureSlug, validateRepositoryPath} from "./repository.mjs";
import {
  atomicWrite,
  DuckbillError,
  errorPayload,
  readJsonFile,
  safeJoin,
  SHA256_PATTERN,
  normalizeRepositoryPath,
} from "./utils.mjs";

export const STATE_SCHEMA = "duckbill/state@1";
export const TASK_STATUSES = ["pending", "running", "partial", "failed", "blocked", "completed", "stale"];
const ARTIFACT_STATUSES = ["missing", "current", "stale"];
const VALIDATION_STATUSES = ["pending", "passed", "failed", "blocked", "stale"];
const EVIDENCE_RESULTS = ["passed", "failed", "blocked"];

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactFields(value, required, optional, path, errors) {
  if (!plainObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const allowed = new Set([...required, ...optional]);
  for (const key of required) if (!Object.hasOwn(value, key)) errors.push(`${path} is missing ${key}`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path} has unknown field ${key}`);
}

function validHash(value, nullable = false) {
  return nullable && value === null ? true : SHA256_PATTERN.test(value ?? "");
}

function validateSnapshot(value, path, errors) {
  exactFields(value, ["commit", "dirtyTreeHash"], [], path, errors);
  if (!plainObject(value)) return;
  if (value.commit !== null && typeof value.commit !== "string") errors.push(`${path}.commit must be a string or null`);
  if (!validHash(value.dirtyTreeHash)) errors.push(`${path}.dirtyTreeHash must be a sha256 hash`);
}

function validateStartedFrom(value, path, errors) {
  exactFields(value, ["specHash", "planHash", "tasksHash", "commit", "dirtyTreeHash"], [], path, errors);
  if (!plainObject(value)) return;
  for (const name of ["specHash", "planHash", "tasksHash"]) if (!validHash(value[name])) errors.push(`${path}.${name} must be a sha256 hash`);
  if (value.commit !== null && typeof value.commit !== "string") errors.push(`${path}.commit must be a string or null`);
  if (!validHash(value.dirtyTreeHash)) errors.push(`${path}.dirtyTreeHash must be a sha256 hash`);
}

function validateArtifactHashes(value, path, errors) {
  exactFields(value, ["specHash", "planHash", "tasksHash"], [], path, errors);
  if (!plainObject(value)) return;
  for (const name of ["specHash", "planHash", "tasksHash"]) {
    if (!validHash(value[name], true)) errors.push(`${path}.${name} must be a sha256 hash or null`);
  }
}

export function validateEvidenceRecord(value, path = "evidence") {
  const errors = [];
  exactFields(
    value,
    ["result", "summary", "command", "exitCode", "commit", "dirtyTreeHash", "observedPaths", "observedPathHashes", "outputDigest", "specHash", "planHash", "tasksHash"],
    ["mappedIds", "stale", "staleReasons"],
    path,
    errors,
  );
  if (!plainObject(value)) return errors;
  if (!EVIDENCE_RESULTS.includes(value.result)) errors.push(`${path}.result is invalid`);
  if (typeof value.summary !== "string" || !value.summary.trim()) errors.push(`${path}.summary is required`);
  if (typeof value.command !== "string" || !value.command.trim()) errors.push(`${path}.command is required`);
  if (!Number.isInteger(value.exitCode)) errors.push(`${path}.exitCode must be an integer`);
  if (value.commit !== null && typeof value.commit !== "string") errors.push(`${path}.commit must be a string or null`);
  for (const name of ["dirtyTreeHash", "outputDigest", "specHash", "planHash", "tasksHash"]) {
    if (!validHash(value[name])) errors.push(`${path}.${name} must be a sha256 hash`);
  }
  if (!Array.isArray(value.observedPaths) || value.observedPaths.some((item) => typeof item !== "string")) errors.push(`${path}.observedPaths must be a string array`);
  if (!plainObject(value.observedPathHashes)) errors.push(`${path}.observedPathHashes must be an object`);
  else {
    for (const observedPath of value.observedPaths ?? []) {
      if (typeof value.observedPathHashes[observedPath] !== "string") errors.push(`${path}.observedPathHashes is missing ${observedPath}`);
    }
  }
  if (value.mappedIds !== undefined && (!Array.isArray(value.mappedIds) || value.mappedIds.some((item) => typeof item !== "string"))) errors.push(`${path}.mappedIds must be a string array`);
  if (value.stale !== undefined && typeof value.stale !== "boolean") errors.push(`${path}.stale must be boolean`);
  if (value.staleReasons !== undefined && (!Array.isArray(value.staleReasons) || value.staleReasons.some((item) => typeof item !== "string"))) errors.push(`${path}.staleReasons must be a string array`);
  return errors;
}

function validateEvidenceMap(value, path, errors, idPattern = null) {
  if (!plainObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const [id, evidence] of Object.entries(value)) {
    if (idPattern && !idPattern.test(id)) errors.push(`${path} has invalid evidence ID ${id}`);
    errors.push(...validateEvidenceRecord(evidence, `${path}.${id}`));
  }
}

function validateTaskRecord(value, id, errors) {
  const path = `state.tasks.${id}`;
  exactFields(value, ["status", "attempts", "evidence", "staleReasons", "retired"], [], path, errors);
  if (!plainObject(value)) return;
  if (!TASK_STATUSES.includes(value.status)) errors.push(`${path}.status is invalid`);
  if (typeof value.retired !== "boolean") errors.push(`${path}.retired must be boolean`);
  if (!Array.isArray(value.staleReasons) || value.staleReasons.some((item) => typeof item !== "string")) errors.push(`${path}.staleReasons must be a string array`);
  validateEvidenceMap(value.evidence, `${path}.evidence`, errors, /^CHK-\d{3}$/u);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) errors.push(`${path} has an invalid task ID`);
  if (["completed", "partial", "failed", "blocked"].includes(value.status) && Object.keys(value.evidence ?? {}).length === 0) errors.push(`${path}.evidence is required for ${value.status}`);
  if (value.status === "completed" && Object.values(value.evidence ?? {}).some((record) => record.result !== "passed" || record.stale)) errors.push(`${path}.completed evidence must all be current and passed`);
  if (!Array.isArray(value.attempts)) errors.push(`${path}.attempts must be an array`);
  else value.attempts.forEach((attempt, index) => {
    const attemptPath = `${path}.attempts[${index}]`;
    exactFields(attempt, ["number", "type", "command", "feedback", "feedbackReferences", "writePaths", "startedFrom", "outcome", "evidence"], [], attemptPath, errors);
    if (!plainObject(attempt)) return;
    if (attempt.number !== index + 1) errors.push(`${attemptPath}.number must be continuous`);
    if (!["execute", "repair"].includes(attempt.type)) errors.push(`${attemptPath}.type is invalid`);
    if (typeof attempt.command !== "string" || !attempt.command) errors.push(`${attemptPath}.command is required`);
    if (attempt.feedback !== null && typeof attempt.feedback !== "string") errors.push(`${attemptPath}.feedback must be a string or null`);
    if (!Array.isArray(attempt.feedbackReferences) || attempt.feedbackReferences.some((item) => typeof item !== "string")) errors.push(`${attemptPath}.feedbackReferences must be a string array`);
    if (!Array.isArray(attempt.writePaths) || attempt.writePaths.some((item) => typeof item !== "string")) errors.push(`${attemptPath}.writePaths must be a string array`);
    validateStartedFrom(attempt.startedFrom, `${attemptPath}.startedFrom`, errors);
    if (attempt.outcome !== null && !["completed", "partial", "failed", "blocked", "stale"].includes(attempt.outcome)) errors.push(`${attemptPath}.outcome is invalid`);
    validateEvidenceMap(attempt.evidence, `${attemptPath}.evidence`, errors, /^CHK-\d{3}$/u);
  });
}

export function validateState(state) {
  const errors = [];
  exactFields(
    state,
    ["schema", "revision", "featureId", "artifacts", "repository", "currentOperation", "pendingClarification", "prerequisites", "tasks", "validation"],
    [],
    "state",
    errors,
  );
  if (!plainObject(state)) return errors;
  if (state.schema !== STATE_SCHEMA) errors.push(`state.schema must be ${STATE_SCHEMA}`);
  if (!Number.isInteger(state.revision) || state.revision < 1) errors.push("state.revision must be a positive integer");
  try { validateFeatureSlug(state.featureId); } catch (error) { errors.push(error.message); }
  exactFields(state.artifacts, ["specHash", "planHash", "tasksHash", "planStatus", "tasksStatus"], [], "state.artifacts", errors);
  if (plainObject(state.artifacts)) {
    for (const name of ["specHash", "planHash", "tasksHash"]) if (!validHash(state.artifacts[name], true)) errors.push(`state.artifacts.${name} must be a sha256 hash or null`);
    for (const name of ["planStatus", "tasksStatus"]) if (!ARTIFACT_STATUSES.includes(state.artifacts[name])) errors.push(`state.artifacts.${name} is invalid`);
  }
  validateSnapshot(state.repository, "state.repository", errors);
  if (state.currentOperation !== null) {
    exactFields(state.currentOperation, ["type", "taskId", "command", "feedback", "feedbackReferences", "writePaths", "startedFrom"], [], "state.currentOperation", errors);
    if (plainObject(state.currentOperation)) {
      if (!["execute", "repair"].includes(state.currentOperation.type)) errors.push("state.currentOperation.type is invalid");
      if (typeof state.currentOperation.taskId !== "string") errors.push("state.currentOperation.taskId is required");
      if (typeof state.currentOperation.command !== "string") errors.push("state.currentOperation.command is required");
      if (state.currentOperation.feedback !== null && typeof state.currentOperation.feedback !== "string") errors.push("state.currentOperation.feedback must be string or null");
      if (state.currentOperation.type === "repair" && (typeof state.currentOperation.feedback !== "string" || !state.currentOperation.feedback.trim())) errors.push("repair currentOperation requires feedback");
      if (!Array.isArray(state.currentOperation.feedbackReferences)) errors.push("state.currentOperation.feedbackReferences must be an array");
      if (!Array.isArray(state.currentOperation.writePaths) || state.currentOperation.writePaths.some((item) => typeof item !== "string")) errors.push("state.currentOperation.writePaths must be a string array");
      validateStartedFrom(state.currentOperation.startedFrom, "state.currentOperation.startedFrom", errors);
    }
  }
  if (state.pendingClarification !== null) {
    exactFields(state.pendingClarification, ["owner", "questions", "command", "skillMode", "arguments", "answers", "startedFrom"], [], "state.pendingClarification", errors);
    if (plainObject(state.pendingClarification)) {
      if (!["specification", "plan"].includes(state.pendingClarification.owner)) errors.push("state.pendingClarification.owner is invalid");
      if (!Array.isArray(state.pendingClarification.questions) || state.pendingClarification.questions.length === 0) errors.push("state.pendingClarification.questions is required");
      else state.pendingClarification.questions.forEach((question, index) => {
        exactFields(question, ["id", "reason", "question", "options"], [], `state.pendingClarification.questions[${index}]`, errors);
        if (!/^Q-\d{3}$/u.test(question?.id ?? "")) errors.push(`state.pendingClarification.questions[${index}].id is invalid`);
        if (typeof question?.reason !== "string" || !question.reason.trim()) errors.push(`state.pendingClarification.questions[${index}].reason is required`);
        if (typeof question?.question !== "string" || !question.question.trim()) errors.push(`state.pendingClarification.questions[${index}].question is required`);
        if (!Array.isArray(question?.options)) errors.push(`state.pendingClarification.questions[${index}].options must be an array`);
      });
      if (typeof state.pendingClarification.command !== "string" || typeof state.pendingClarification.skillMode !== "string") errors.push("state.pendingClarification source is invalid");
      if (!plainObject(state.pendingClarification.arguments) || !plainObject(state.pendingClarification.answers)) errors.push("state.pendingClarification context is invalid");
      else {
        const questionIds = new Set((state.pendingClarification.questions ?? []).map((question) => question.id));
        for (const [id, answer] of Object.entries(state.pendingClarification.answers)) {
          if (!questionIds.has(id) || typeof answer !== "string" || !answer.trim()) errors.push(`state.pendingClarification.answers.${id} is invalid`);
        }
      }
      validateArtifactHashes(state.pendingClarification.startedFrom, "state.pendingClarification.startedFrom", errors);
    }
  }
  validateEvidenceMap(state.prerequisites, "state.prerequisites", errors, /^PRE-\d{3}$/u);
  if (!plainObject(state.tasks)) errors.push("state.tasks must be an object");
  else for (const [id, record] of Object.entries(state.tasks)) validateTaskRecord(record, id, errors);
  exactFields(state.validation, ["status", "evidence", "staleReasons"], [], "state.validation", errors);
  if (plainObject(state.validation)) {
    if (!VALIDATION_STATUSES.includes(state.validation.status)) errors.push("state.validation.status is invalid");
    validateEvidenceMap(state.validation.evidence, "state.validation.evidence", errors, /^VAL-\d{3}$/u);
    if (!Array.isArray(state.validation.staleReasons)) errors.push("state.validation.staleReasons must be an array");
  }
  if (state.currentOperation) {
    const task = state.tasks?.[state.currentOperation.taskId];
    if (!task || task.status !== "running") errors.push("current operation must reference a running task");
    const attempt = task?.attempts?.at(-1);
    if (!attempt || attempt.outcome !== null || attempt.type !== state.currentOperation.type) errors.push("current operation must match the open task attempt");
  }
  for (const [id, record] of Object.entries(state.tasks ?? {})) {
    if (record.status === "running" && state.currentOperation?.taskId !== id) errors.push(`running task has no matching current operation: ${id}`);
  }
  return errors;
}

function assertValidState(state) {
  const errors = validateState(state);
  if (errors.length) throw new DuckbillError("INVALID_STATE", "state validation failed", {errors});
}

function taskRecord() {
  return {status: "pending", attempts: [], evidence: {}, staleReasons: [], retired: false};
}

export function initializeState({featureId, hashes = {}, repository, taskIds = []}) {
  validateFeatureSlug(featureId);
  const state = {
    schema: STATE_SCHEMA,
    revision: 1,
    featureId,
    artifacts: {
      specHash: hashes.specHash ?? null,
      planHash: hashes.planHash ?? null,
      tasksHash: hashes.tasksHash ?? null,
      planStatus: hashes.planHash ? "current" : "missing",
      tasksStatus: hashes.tasksHash ? "current" : "missing",
    },
    repository: {commit: repository.commit ?? null, dirtyTreeHash: repository.dirtyTreeHash},
    currentOperation: null,
    pendingClarification: null,
    prerequisites: {},
    tasks: Object.fromEntries(taskIds.map((id) => [id, taskRecord()])),
    validation: {status: "pending", evidence: {}, staleReasons: []},
  };
  assertValidState(state);
  return state;
}

export function loadState(path) {
  if (!existsSync(path) || lstatSync(path).isSymbolicLink()) throw new DuckbillError("STATE_NOT_FOUND", `state file is missing or unsafe: ${path}`);
  const state = readJsonFile(path);
  assertValidState(state);
  return state;
}

function mutate(state, operation) {
  assertValidState(state);
  const next = structuredClone(state);
  operation(next);
  next.revision = state.revision + 1;
  assertValidState(next);
  return next;
}

export function writeState(path, nextState, expectedRevision) {
  const lockPath = `${path}.lock`;
  let lock;
  try {
    try { lock = openSync(lockPath, "wx", 0o600); }
    catch (error) { if (error?.code === "EEXIST") throw new DuckbillError("STATE_LOCKED", "another state writer holds the lock"); throw error; }
    if (!Number.isInteger(expectedRevision)) throw new DuckbillError("EXPECTED_REVISION_REQUIRED", "expected revision is required");
    const current = loadState(path);
    if (current.revision !== expectedRevision) {
      throw new DuckbillError("REVISION_CONFLICT", `expected revision ${expectedRevision}, found ${current.revision}`);
    }
    if (nextState.revision !== expectedRevision + 1) {
      throw new DuckbillError("INVALID_REVISION", `next revision must be ${expectedRevision + 1}`);
    }
    assertValidState(nextState);
    atomicWrite(path, `${JSON.stringify(nextState, null, 2)}\n`);
    return nextState;
  } finally {
    if (lock !== undefined) {
      closeSync(lock);
      rmSync(lockPath, {force: true});
    }
  }
}

export function initializeStateFile(path, state) {
  const lockPath = `${path}.lock`;
  let lock;
  try {
    try { lock = openSync(lockPath, "wx", 0o600); }
    catch (error) { if (error?.code === "EEXIST") throw new DuckbillError("STATE_LOCKED", "another state writer holds the lock"); throw error; }
    if (existsSync(path)) throw new DuckbillError("STATE_EXISTS", `state already exists: ${path}`);
    assertValidState(state);
    if (state.revision !== 1) throw new DuckbillError("INVALID_REVISION", "initial state revision must be 1");
    atomicWrite(path, `${JSON.stringify(state, null, 2)}\n`);
    return state;
  } finally {
    if (lock !== undefined) {
      closeSync(lock);
      rmSync(lockPath, {force: true});
    }
  }
}

function startedFrom(state, repositorySnapshot = state.repository) {
  for (const name of ["specHash", "planHash", "tasksHash"]) {
    if (!state.artifacts[name]) throw new DuckbillError("ARTIFACT_NOT_READY", `${name} is missing`);
  }
  return {
    specHash: state.artifacts.specHash,
    planHash: state.artifacts.planHash,
    tasksHash: state.artifacts.tasksHash,
    commit: repositorySnapshot.commit,
    dirtyTreeHash: repositorySnapshot.dirtyTreeHash,
  };
}

function clarificationComplete(clarification) {
  return clarification && clarification.questions.every((question) => clarification.answers[question.id]);
}

function requireExecutionReady(state) {
  if (state.artifacts.planStatus !== "current" || state.artifacts.tasksStatus !== "current") throw new DuckbillError("ARTIFACT_STALE", "plan and tasks must be current");
  if (state.pendingClarification && !clarificationComplete(state.pendingClarification)) throw new DuckbillError("CLARIFICATION_PENDING", "pending clarification must be answered first");
  if (state.currentOperation) throw new DuckbillError("OPERATION_RUNNING", `operation already running for ${state.currentOperation.taskId}`);
}

export function beginOperation(state, {type, taskId, command, feedback = null, feedbackReferences = [], writePaths = [], repositorySnapshot = state.repository, tasksModel}) {
  return mutate(state, (next) => {
    requireExecutionReady(next);
    if (clarificationComplete(next.pendingClarification)) next.pendingClarification = null;
    if (!["execute", "repair"].includes(type)) throw new DuckbillError("INVALID_OPERATION", "operation type must be execute or repair");
    const task = next.tasks[taskId];
    const definition = tasksModel?.tasks?.find((item) => item.id === taskId);
    if (!task || task.retired || !definition) throw new DuckbillError("TASK_NOT_FOUND", `unknown current task: ${taskId}`);
    if (type === "execute" && !["pending", "partial", "failed"].includes(task.status)) {
      throw new DuckbillError("INVALID_TASK_STATUS", `execute cannot start task in ${task.status} status`);
    }
    if (type === "repair" && task.status !== "completed") throw new DuckbillError("INVALID_TASK_STATUS", "repair requires a completed task");
    if (type === "repair" && (typeof feedback !== "string" || !feedback.trim())) throw new DuckbillError("FEEDBACK_REQUIRED", "repair requires persisted feedback");
    const incompletePrerequisites = (tasksModel?.prerequisites ?? []).map((item) => item.id).filter((id) => {
      const record = next.prerequisites[id];
      return record?.result !== "passed" || record.stale || ["specHash", "planHash", "tasksHash"].some((name) => record[name] !== next.artifacts[name]);
    });
    if (incompletePrerequisites.length) throw new DuckbillError("INCOMPLETE_PREREQUISITES", `task prerequisites are incomplete: ${incompletePrerequisites.join(", ")}`);
    const incomplete = definition.dependencies.filter((id) => next.tasks[id]?.status !== "completed");
    if (incomplete.length) throw new DuckbillError("INCOMPLETE_DEPENDENCIES", `task dependencies are incomplete: ${incomplete.join(", ")}`);
    const normalizedWritePaths = unique(writePaths.map(normalizeRepositoryPath)).sort();
    const operation = {type, taskId, command, feedback, feedbackReferences: [...feedbackReferences], writePaths: normalizedWritePaths, startedFrom: startedFrom(next, repositorySnapshot)};
    task.attempts.push({
      number: task.attempts.length + 1,
      type,
      command,
      feedback,
      feedbackReferences: [...feedbackReferences],
      writePaths: normalizedWritePaths,
      startedFrom: operation.startedFrom,
      outcome: null,
      evidence: {},
    });
    task.status = "running";
    task.evidence = {};
    task.staleReasons = [];
    next.currentOperation = operation;
    next.validation = {status: "stale", evidence: {}, staleReasons: ["task-operation-started"]};
  });
}

function normalizeEvidenceMap(evidence) {
  if (!plainObject(evidence) || Object.keys(evidence).length === 0) throw new DuckbillError("EVIDENCE_REQUIRED", "task outcome requires evidence");
  for (const [id, record] of Object.entries(evidence)) {
    const errors = validateEvidenceRecord(record, `evidence.${id}`);
    if (errors.length) throw new DuckbillError("INVALID_EVIDENCE", `invalid evidence for ${id}`, {errors});
  }
  return structuredClone(evidence);
}

export function deriveTaskOutcome({implementationStatus, evidence, boundaryOk = true, ownershipConflict = false}) {
  if (!boundaryOk || ownershipConflict) return "blocked";
  const records = Object.values(evidence ?? {});
  if (records.length === 0) return "blocked";
  if (records.some((record) => record.result === "blocked" || record.stale)) return "blocked";
  if (records.some((record) => record.result === "failed")) return implementationStatus === "partial" ? "partial" : "failed";
  if (records.every((record) => record.result === "passed")) return "completed";
  return "blocked";
}

export function deriveValidationStatus(evidence) {
  const records = Object.values(evidence ?? {});
  if (records.length === 0 || records.some((record) => record.result === "blocked" || record.stale)) return "blocked";
  if (records.some((record) => record.result === "failed")) return "failed";
  return records.every((record) => record.result === "passed") ? "passed" : "blocked";
}

export function finishOperation(state, {taskId, outcome, evidence, expectedCheckIds = null}) {
  return mutate(state, (next) => {
    if (!next.currentOperation || next.currentOperation.taskId !== taskId) throw new DuckbillError("INVALID_OPERATION", `current operation is not ${taskId}`);
    if (!["completed", "partial", "failed", "blocked"].includes(outcome)) throw new DuckbillError("INVALID_OUTCOME", `invalid task outcome: ${outcome}`);
    const normalized = normalizeEvidenceMap(evidence);
    for (const [checkId, record] of Object.entries(normalized)) {
      for (const name of ["specHash", "planHash", "tasksHash"]) {
        if (record[name] !== next.artifacts[name]) throw new DuckbillError("STALE_EVIDENCE", `${checkId} evidence uses stale ${name}`);
      }
    }
    if (expectedCheckIds) {
      const actual = Object.keys(normalized).sort();
      const expected = [...expectedCheckIds].sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new DuckbillError("INCOMPLETE_EVIDENCE", "evidence must include every task check exactly once", {expected, actual});
    }
    const allPassed = Object.values(normalized).every((record) => record.result === "passed" && !record.stale);
    if (outcome === "completed" && !allPassed) throw new DuckbillError("INVALID_OUTCOME", "completed outcome requires all current evidence to pass");
    if (["partial", "failed"].includes(outcome) && allPassed) throw new DuckbillError("INVALID_OUTCOME", `${outcome} outcome cannot contain only passing evidence`);
    const task = next.tasks[taskId];
    const attempt = task.attempts.at(-1);
    attempt.outcome = outcome;
    attempt.evidence = normalized;
    task.status = outcome;
    task.evidence = normalized;
    task.staleReasons = [];
    const snapshotKeys = unique(Object.values(normalized).map((record) => JSON.stringify([record.commit, record.dirtyTreeHash])));
    if (snapshotKeys.length !== 1) throw new DuckbillError("INCONSISTENT_EVIDENCE", "all task evidence must use one repository snapshot");
    const [commit, dirtyTreeHash] = JSON.parse(snapshotKeys[0]);
    next.repository = {commit, dirtyTreeHash};
    next.currentOperation = null;
    next.validation = {status: "stale", evidence: {}, staleReasons: [`task-${outcome}:${taskId}`]};
  });
}

export function abandonInvalidatedOperation(state, reason = "operation-invalidated") {
  if (!state.currentOperation) return state;
  return mutate(state, (next) => {
    const {taskId} = next.currentOperation;
    const task = next.tasks[taskId];
    const attempt = task.attempts.at(-1);
    attempt.outcome = "stale";
    task.status = "stale";
    task.evidence = {};
    task.staleReasons = unique([...task.staleReasons, reason]);
    next.currentOperation = null;
    next.validation = {status: "stale", evidence: {}, staleReasons: [reason]};
  });
}

export function saveClarification(state, context) {
  return mutate(state, (next) => {
    if (next.pendingClarification && !clarificationComplete(next.pendingClarification)) {
      throw new DuckbillError("CLARIFICATION_PENDING", "clarification is already pending");
    }
    if (next.pendingClarification && (next.pendingClarification.command !== context.command || next.pendingClarification.skillMode !== context.skillMode)) {
      throw new DuckbillError("CLARIFICATION_PENDING", "answered clarification belongs to another operation");
    }
    if (!["specification", "plan"].includes(context.owner) || !Array.isArray(context.questions) || context.questions.length === 0) {
      throw new DuckbillError("INVALID_CLARIFICATION", "clarification requires owner and questions");
    }
    const ids = context.questions.map((question) => question.id);
    if (new Set(ids).size !== ids.length || ids.some((id) => !/^Q-\d{3}$/u.test(id))) throw new DuckbillError("INVALID_CLARIFICATION", "question IDs must be unique Q-### values");
    const source = context.startedFrom ?? state.artifacts;
    next.pendingClarification = {
      owner: context.owner,
      questions: structuredClone(context.questions),
      command: context.command,
      skillMode: context.skillMode,
      arguments: structuredClone(context.arguments ?? {}),
      answers: structuredClone(context.answers ?? {}),
      startedFrom: Object.fromEntries(["specHash", "planHash", "tasksHash"].map((name) => [name, source[name] ?? null])),
    };
  });
}

export function resumeClarification(state, answers, currentHashes = state.artifacts) {
  let context;
  let stale = false;
  const next = mutate(state, (draft) => {
    if (!draft.pendingClarification) throw new DuckbillError("NO_PENDING_CLARIFICATION", "there is no pending clarification");
    if (!plainObject(answers)) throw new DuckbillError("INVALID_CLARIFICATION_ANSWERS", "answers must be an object keyed by question ID");
    stale = ["specHash", "planHash", "tasksHash"].some((name) => draft.pendingClarification.startedFrom[name] !== currentHashes[name]);
    if (stale) {
      draft.pendingClarification = null;
      return;
    }
    const allowed = new Set(draft.pendingClarification.questions.map((question) => question.id));
    for (const [id, answer] of Object.entries(answers)) {
      if (!allowed.has(id) || typeof answer !== "string" || !answer.trim()) throw new DuckbillError("INVALID_CLARIFICATION_ANSWERS", `invalid answer for ${id}`);
      draft.pendingClarification.answers[id] = answer.trim();
    }
    context = structuredClone(draft.pendingClarification);
  });
  return {state: next, stale, complete: !stale && clarificationComplete(next.pendingClarification), context: stale ? null : context};
}

export function recordPrerequisites(state, evidence, expectedIds = null) {
  return mutate(state, (next) => {
    if (next.currentOperation) throw new DuckbillError("OPERATION_RUNNING", "cannot record prerequisites during an operation");
    const normalized = Object.keys(evidence).length === 0 ? {} : normalizeEvidenceMap(evidence);
    if (expectedIds && JSON.stringify(Object.keys(normalized).sort()) !== JSON.stringify([...expectedIds].sort())) {
      throw new DuckbillError("INCOMPLETE_EVIDENCE", "prerequisite evidence must include every PRE item", {expectedIds});
    }
    for (const [id, record] of Object.entries(normalized)) {
      for (const name of ["specHash", "planHash", "tasksHash"]) if (record[name] !== next.artifacts[name]) throw new DuckbillError("STALE_EVIDENCE", `${id} evidence uses stale ${name}`);
    }
    next.prerequisites = normalized;
    next.validation = {status: "stale", evidence: {}, staleReasons: ["prerequisites-changed"]};
  });
}

export function recordSpecification(state, {specHash, repository}) {
  return mutate(state, (next) => {
    if (!validHash(specHash)) throw new DuckbillError("INVALID_ARTIFACT_HASH", "specHash must be a sha256 hash");
    if (next.artifacts.specHash && next.artifacts.specHash !== specHash && next.artifacts.planStatus !== "missing") {
      throw new DuckbillError("USE_SPEC_REFINEMENT", "an existing planned specification must be changed through specification refinement");
    }
    next.artifacts.specHash = specHash;
    next.repository = {commit: repository.commit, dirtyTreeHash: repository.dirtyTreeHash};
    next.pendingClarification = null;
  });
}

function changedIds(oldValues = {}, newValues = {}) {
  const ids = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
  return [...ids].filter((id) => oldValues[id] !== newValues[id]);
}

function reverseDependencyGraph(...taskModels) {
  const reverse = new Map();
  for (const model of taskModels.filter(Boolean)) {
    for (const task of model.tasks ?? []) {
      if (!reverse.has(task.id)) reverse.set(task.id, new Set());
      for (const dependency of task.dependencies ?? []) {
        if (!reverse.has(dependency)) reverse.set(dependency, new Set());
        reverse.get(dependency).add(task.id);
      }
    }
  }
  return reverse;
}

function expandDependents(initial, ...taskModels) {
  const reverse = reverseDependencyGraph(...taskModels);
  const affected = new Set(initial);
  const queue = [...affected];
  while (queue.length) {
    const id = queue.shift();
    for (const dependent of reverse.get(id) ?? []) {
      if (!affected.has(dependent)) {
        affected.add(dependent);
        queue.push(dependent);
      }
    }
  }
  return affected;
}

function invalidateTaskRecord(record, reason, status = null) {
  if (record.status === "running") {
    const attempt = record.attempts.at(-1);
    if (attempt) attempt.outcome = "stale";
  }
  record.status = status ?? (["completed", "running", "stale"].includes(record.status) ? "stale" : "pending");
  record.evidence = {};
  record.staleReasons = unique([...record.staleReasons, reason]);
}

function idHashesFromSpec(model) {
  return model?.idHashes ?? {};
}

function planConstraintHashes(model) {
  return model?.idConstraintHashes ?? {};
}

export function reconcileTasks(state, options) {
  const {
    oldTasks,
    newTasks,
    oldSpec,
    newSpec,
    oldPlan,
    newPlan,
    hashes,
    repository,
    agentAffectedTaskIds = [],
  } = options;
  const oldById = Object.fromEntries((oldTasks?.tasks ?? []).map((task) => [task.id, task]));
  const newById = Object.fromEntries((newTasks?.tasks ?? []).map((task) => [task.id, task]));
  const changedIntentIds = new Set([
    ...changedIds(idHashesFromSpec(oldSpec), idHashesFromSpec(newSpec)),
    ...changedIds(planConstraintHashes(oldPlan), planConstraintHashes(newPlan)),
  ]);
  const direct = new Set(agentAffectedTaskIds);
  for (const id of new Set([...Object.keys(oldById), ...Object.keys(newById)])) {
    if (!oldById[id] || !newById[id] || oldById[id].fingerprint !== newById[id].fingerprint) direct.add(id);
  }
  for (const task of [...(oldTasks?.tasks ?? []), ...(newTasks?.tasks ?? [])]) {
    if ([...task.scenarios, ...task.requirements].some((id) => changedIntentIds.has(id))) direct.add(task.id);
  }
  if (state.currentOperation && direct.has(state.currentOperation.taskId)) direct.add(state.currentOperation.taskId);
  const affected = expandDependents(direct, oldTasks, newTasks);
  const next = mutate(state, (draft) => {
    const oldPrerequisites = Object.fromEntries((oldTasks?.prerequisites ?? []).map((item) => [item.id, item.text]));
    const newPrerequisites = Object.fromEntries((newTasks?.prerequisites ?? []).map((item) => [item.id, item.text]));
    draft.prerequisites = Object.fromEntries(Object.entries(draft.prerequisites).filter(([id, evidence]) => {
      const unchanged = Object.hasOwn(oldPrerequisites, id) && oldPrerequisites[id] === newPrerequisites[id];
      if (unchanged) {
        evidence.specHash = hashes.specHash;
        evidence.planHash = hashes.planHash;
        evidence.tasksHash = hashes.tasksHash;
      }
      return unchanged;
    }));
    const nextRecords = {};
    for (const task of newTasks.tasks) {
      const record = structuredClone(draft.tasks[task.id] ?? taskRecord());
      record.retired = false;
      if (affected.has(task.id)) invalidateTaskRecord(record, "artifact-reconciled", "pending");
      else {
        for (const evidence of Object.values(record.evidence)) {
          evidence.specHash = hashes.specHash;
          evidence.planHash = hashes.planHash;
          evidence.tasksHash = hashes.tasksHash;
        }
      }
      nextRecords[task.id] = record;
    }
    for (const id of Object.keys(oldById)) {
      if (!newById[id]) {
        const record = structuredClone(draft.tasks[id] ?? taskRecord());
        record.retired = true;
        invalidateTaskRecord(record, "task-retired", "stale");
        nextRecords[id] = record;
      }
    }
    if (draft.currentOperation && affected.has(draft.currentOperation.taskId)) {
      const record = nextRecords[draft.currentOperation.taskId];
      if (record?.attempts.at(-1)?.outcome === null) record.attempts.at(-1).outcome = "stale";
      draft.currentOperation = null;
    }
    draft.tasks = nextRecords;
    draft.artifacts = {
      specHash: hashes.specHash,
      planHash: hashes.planHash,
      tasksHash: hashes.tasksHash,
      planStatus: "current",
      tasksStatus: "current",
    };
    draft.repository = {commit: repository.commit, dirtyTreeHash: repository.dirtyTreeHash};
    draft.validation = {status: "stale", evidence: {}, staleReasons: ["artifacts-reconciled"]};
    draft.pendingClarification = null;
  });
  return {state: next, affectedTaskIds: [...affected].sort(), changedIntentIds: [...changedIntentIds].sort()};
}

function invalidateMappedTasks(state, tasksModel, directIds, reason) {
  const affected = expandDependents(directIds, tasksModel);
  return {
    state: mutate(state, (next) => {
      for (const id of affected) if (next.tasks[id]) invalidateTaskRecord(next.tasks[id], reason);
      if (next.currentOperation && affected.has(next.currentOperation.taskId)) {
        const record = next.tasks[next.currentOperation.taskId];
        if (record?.attempts.at(-1)?.outcome === null) record.attempts.at(-1).outcome = "stale";
        next.currentOperation = null;
      }
      next.validation = {status: "stale", evidence: {}, staleReasons: [reason]};
    }),
    affectedTaskIds: [...affected].sort(),
  };
}

export function invalidateAfterSpecChange(state, {oldSpec, newSpec, tasksModel, specHash}) {
  const changed = new Set(changedIds(idHashesFromSpec(oldSpec), idHashesFromSpec(newSpec)));
  const direct = (tasksModel?.tasks ?? []).filter((task) => [...task.scenarios, ...task.requirements].some((id) => changed.has(id))).map((task) => task.id);
  const result = invalidateMappedTasks(state, tasksModel, direct, "specification-changed");
  result.state.artifacts.specHash = specHash;
  if (result.state.artifacts.planStatus !== "missing") result.state.artifacts.planStatus = "stale";
  if (result.state.artifacts.tasksStatus !== "missing") result.state.artifacts.tasksStatus = "stale";
  result.state.pendingClarification = null;
  assertValidState(result.state);
  return result;
}

export function invalidateAfterPlanChange(state, {oldPlan, newPlan, tasksModel, planHash}) {
  const changed = new Set(changedIds(planConstraintHashes(oldPlan), planConstraintHashes(newPlan)));
  const direct = (tasksModel?.tasks ?? []).filter((task) => [...task.scenarios, ...task.requirements].some((id) => changed.has(id))).map((task) => task.id);
  const result = invalidateMappedTasks(state, tasksModel, direct, "plan-changed");
  result.state.artifacts.planHash = planHash;
  result.state.artifacts.tasksStatus = "stale";
  result.state.pendingClarification = null;
  assertValidState(result.state);
  return result;
}

export function refreshEvidenceStaleness(state, repoRoot) {
  const observed = unique([
    ...Object.values(state.prerequisites).flatMap((record) => record.observedPaths ?? []),
    ...Object.values(state.tasks).flatMap((task) => Object.values(task.evidence).flatMap((record) => record.observedPaths ?? [])),
    ...Object.values(state.validation.evidence).flatMap((record) => record.observedPaths ?? []),
  ]);
  const snapshot = captureRepositorySnapshot(repoRoot, {observedPaths: observed});
  return mutate(state, (next) => {
    let anyStale = false;
    for (const evidence of Object.values(next.prerequisites)) {
      const result = detectEvidenceStaleness(evidence, snapshot);
      evidence.stale = result.stale;
      evidence.staleReasons = result.reasons;
      if (result.stale) anyStale = true;
    }
    for (const [taskId, task] of Object.entries(next.tasks)) {
      const reasons = [];
      for (const evidence of Object.values(task.evidence)) {
        const result = detectEvidenceStaleness(evidence, snapshot);
        evidence.stale = result.stale;
        evidence.staleReasons = result.reasons;
        reasons.push(...result.reasons);
      }
      if (reasons.length) {
        task.status = "stale";
        task.staleReasons = unique([...task.staleReasons, ...reasons]);
        anyStale = true;
      }
    }
    if (anyStale) next.validation = {status: "stale", evidence: {}, staleReasons: ["task-evidence-stale"]};
    next.repository = {commit: snapshot.commit, dirtyTreeHash: snapshot.dirtyTreeHash};
  });
}

export function featureValidationPrerequisites(state, {hashes, snapshot, tasksModel = null}) {
  const reasons = [];
  if (state.currentOperation) reasons.push("operation-running");
  if (state.pendingClarification) reasons.push("clarification-pending");
  if (state.artifacts.planStatus !== "current") reasons.push("plan-stale");
  if (state.artifacts.tasksStatus !== "current") reasons.push("tasks-stale");
  for (const name of ["specHash", "planHash", "tasksHash"]) if (state.artifacts[name] !== hashes[name]) reasons.push(`${name}-stale`);
  for (const prerequisite of tasksModel?.prerequisites ?? []) {
    const evidence = state.prerequisites[prerequisite.id];
    if (evidence?.result !== "passed" || evidence.stale) reasons.push(`prerequisite-not-current:${prerequisite.id}`);
    else {
      for (const name of ["specHash", "planHash", "tasksHash"]) if (evidence[name] !== hashes[name]) reasons.push(`prerequisite-evidence:${prerequisite.id}:artifact-changed:${name}`);
      for (const reason of detectEvidenceStaleness(evidence, snapshot).reasons) reasons.push(`prerequisite-evidence:${prerequisite.id}:${reason}`);
    }
  }
  for (const [id, task] of Object.entries(state.tasks)) {
    if (!task.retired && task.status !== "completed") reasons.push(`task-not-completed:${id}`);
    if (!task.retired && Object.keys(task.evidence).length === 0) reasons.push(`task-evidence-missing:${id}`);
    for (const evidence of Object.values(task.evidence)) {
      for (const name of ["specHash", "planHash", "tasksHash"]) {
        if (evidence[name] !== hashes[name]) reasons.push(`task-evidence:${id}:artifact-changed:${name}`);
      }
      if (evidence.stale) reasons.push(`task-evidence:${id}:marked-stale`);
      const freshness = detectEvidenceStaleness(evidence, snapshot);
      for (const reason of freshness.reasons) reasons.push(`task-evidence:${id}:${reason}`);
    }
  }
  return {ok: reasons.length === 0, reasons: unique(reasons)};
}

export function recordFeatureValidation(state, {status, evidence}) {
  return mutate(state, (next) => {
    if (!["passed", "failed", "blocked"].includes(status)) throw new DuckbillError("INVALID_VALIDATION_STATUS", "validation status must be passed, failed, or blocked");
    const normalized = normalizeEvidenceMap(evidence);
    for (const [checkId, record] of Object.entries(normalized)) {
      for (const name of ["specHash", "planHash", "tasksHash"]) {
        if (record[name] !== next.artifacts[name]) throw new DuckbillError("STALE_EVIDENCE", `${checkId} evidence uses stale ${name}`);
      }
    }
    const allPassed = Object.values(normalized).every((record) => record.result === "passed" && !record.stale);
    if (status === "passed" && !allPassed) throw new DuckbillError("INVALID_VALIDATION_STATUS", "passed validation requires all current evidence to pass");
    if (status !== "passed" && allPassed) throw new DuckbillError("INVALID_VALIDATION_STATUS", `${status} validation cannot contain only passing evidence`);
    next.validation = {status, evidence: normalized, staleReasons: []};
  });
}

export function generateStatusData(state, context = {}) {
  const currentHashes = context.hashes ?? state.artifacts;
  const currentSnapshot = context.snapshot ?? state.repository;
  const operationSnapshot = context.operationSnapshot ?? currentSnapshot;
  const counts = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0]));
  for (const task of Object.values(state.tasks)) if (!task.retired) counts[task.status] += 1;
  const artifactStaleness = {
    spec: state.artifacts.specHash === currentHashes.specHash ? "current" : "stale",
    plan: state.artifacts.planStatus === "current" && state.artifacts.planHash === currentHashes.planHash ? "current" : state.artifacts.planStatus,
    tasks: state.artifacts.tasksStatus === "current" && state.artifacts.tasksHash === currentHashes.tasksHash ? "current" : state.artifacts.tasksStatus,
  };
  const evidenceStaleness = [];
  for (const [id, task] of Object.entries(state.tasks)) {
    const liveStale = Object.values(task.evidence).some((item) => detectEvidenceStaleness(item, currentSnapshot).stale);
    if (task.status === "stale" || Object.values(task.evidence).some((item) => item.stale) || liveStale) evidenceStaleness.push(id);
  }
  const drift = detectRepositoryDrift(state.repository, currentSnapshot, {baselineArtifacts: state.artifacts, currentArtifacts: currentHashes});
  const currentOperationStaleness = [];
  if (state.currentOperation) {
    for (const name of ["specHash", "planHash", "tasksHash"]) {
      if (state.currentOperation.startedFrom[name] !== currentHashes[name]) currentOperationStaleness.push(`${name}-changed`);
    }
    if (state.currentOperation.startedFrom.commit !== operationSnapshot.commit) currentOperationStaleness.push("commit-changed");
    if (state.currentOperation.startedFrom.dirtyTreeHash !== operationSnapshot.dirtyTreeHash) currentOperationStaleness.push("dirty-tree-changed");
  }
  const specStatus = context.specStatus ?? "unknown";
  let next = null;
  if (state.pendingClarification) {
    const args = Array.isArray(state.pendingClarification.arguments.argv)
      ? state.pendingClarification.arguments.argv.map(String)
      : Object.values(state.pendingClarification.arguments).map(String);
    next = {command: state.pendingClarification.command, args};
  }
  else if (specStatus === "draft") next = {command: "duck-spec", args: [state.featureId]};
  else if (["missing", "unknown"].includes(specStatus)) next = null;
  else if (artifactStaleness.plan === "missing" && artifactStaleness.tasks === "missing") next = {command: "duck-plan", args: [state.featureId]};
  else if (artifactStaleness.plan !== "current" || artifactStaleness.tasks !== "current") next = {command: "duck-sync", args: [state.featureId]};
  else if (state.currentOperation?.type === "repair") next = {
    command: state.currentOperation.command,
    args: [state.featureId, "--scope", "code", "--task", state.currentOperation.taskId, state.currentOperation.feedback],
  };
  else if (state.currentOperation) next = {command: state.currentOperation.command, args: [state.featureId, state.currentOperation.taskId]};
  else {
    const taskDefinitions = context.tasksModel?.tasks ?? [];
    const pending = Object.entries(state.tasks).find(([id, task]) => {
      if (task.retired || !["pending", "partial", "failed"].includes(task.status)) return false;
      const definition = taskDefinitions.find((item) => item.id === id);
      return definition && definition.dependencies.every((dependency) => state.tasks[dependency]?.status === "completed");
    });
    if (pending) next = {command: "duck-execute", args: [state.featureId, pending[0]]};
    else {
      const requiredTasks = Object.values(state.tasks).filter((task) => !task.retired);
      if (requiredTasks.length > 0 && requiredTasks.every((task) => task.status === "completed") && state.validation.status !== "passed") {
        next = {command: "duck-validate", args: [state.featureId]};
      }
    }
  }
  return {
    feature: state.featureId,
    specStatus,
    planStatus: artifactStaleness.plan,
    tasksStatus: artifactStaleness.tasks,
    currentOperation: state.currentOperation,
    currentOperationStaleness,
    pendingClarification: state.pendingClarification,
    completedTasks: counts.completed,
    pendingTasks: counts.pending,
    partialTasks: counts.partial,
    failedTasks: counts.failed,
    blockedTasks: counts.blocked,
    artifactStaleness,
    evidenceStaleness,
    featureValidation: state.validation.status,
    repositoryDrift: drift,
    next,
  };
}

function unique(values) {
  return [...new Set(values)];
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new DuckbillError("INVALID_ARGUMENT", `invalid argument: ${key ?? "missing"}`);
    options[key.slice(2)] = value;
  }
  return {command, options};
}

function required(options, name) {
  if (options[name] === undefined) throw new DuckbillError("INVALID_ARGUMENT", `missing --${name}`);
  return options[name];
}

function evidenceJson(options) {
  try { return JSON.parse(required(options, "evidence")); }
  catch (error) { if (error instanceof DuckbillError) throw error; throw new DuckbillError("INVALID_ARGUMENT", `invalid evidence JSON: ${error.message}`); }
}

function assertEvidenceSnapshot(evidence, hashes, snapshot) {
  const errors = [];
  for (const [id, record] of Object.entries(evidence)) {
    if (record.commit !== snapshot.commit) errors.push(`${id}: commit does not match current repository`);
    if (record.dirtyTreeHash !== snapshot.dirtyTreeHash) errors.push(`${id}: dirtyTreeHash does not match current repository`);
    for (const name of ["specHash", "planHash", "tasksHash"]) if (record[name] !== hashes[name]) errors.push(`${id}: ${name} is stale`);
    for (const path of record.observedPaths ?? []) {
      if (record.observedPathHashes?.[path] !== snapshot.observedPathHashes?.[path]) errors.push(`${id}: observed path is stale: ${path}`);
    }
  }
  if (errors.length) throw new DuckbillError("STALE_EVIDENCE", "evidence metadata does not match current artifacts and repository", {errors});
}

function commitMutation(path, expectedRevision, operation) {
  const current = loadState(path);
  if (current.revision !== expectedRevision) throw new DuckbillError("REVISION_CONFLICT", `expected revision ${expectedRevision}, found ${current.revision}`);
  const output = operation(current);
  const next = output?.state ?? output;
  writeState(path, next, expectedRevision);
  return output;
}

function readOptionalArtifact(path, parser) {
  if (!path || path === "none") return null;
  return parser(readFileSync(resolve(path), "utf8")).model;
}

function currentArtifactHashes(repoRoot, paths) {
  const input = {specPath: paths.spec, planPath: paths.plan, tasksPath: paths.tasks};
  for (const [sourceName, repositoryPath] of [["specSource", paths.spec], ["planSource", paths.plan], ["tasksSource", paths.tasks]]) {
    const absolute = safeJoin(repoRoot, repositoryPath);
    if (existsSync(absolute)) input[sourceName] = readFileSync(absolute, "utf8");
  }
  return checkArtifacts(input).hashes;
}

function main(argv) {
  const {command, options} = parseArgs(argv);
  const repoRoot = resolve(options.repo ?? process.cwd());
  const featureId = required(options, "feature");
  const paths = canonicalFeaturePaths(featureId);
  const statePath = safeJoin(repoRoot, paths.state);
  if (command === "read") {
    process.stdout.write(`${JSON.stringify({ok: true, state: loadState(statePath)})}\n`);
    return;
  }
  if (command === "status") {
    const sources = {};
    for (const [name, path] of [["specSource", paths.spec], ["planSource", paths.plan], ["tasksSource", paths.tasks]]) {
      const absolute = safeJoin(repoRoot, path);
      if (existsSync(absolute)) sources[name] = readFileSync(absolute, "utf8");
    }
    const checked = checkArtifacts({...sources, specPath: paths.spec, planPath: paths.plan, tasksPath: paths.tasks});
    const state = loadState(statePath);
    const observedPaths = unique([
      ...Object.values(state.tasks).flatMap((task) => Object.values(task.evidence).flatMap((record) => record.observedPaths ?? [])),
      ...Object.values(state.validation.evidence).flatMap((record) => record.observedPaths ?? []),
    ]);
    const snapshot = captureRepositorySnapshot(repoRoot, {observedPaths});
    const operationSnapshot = state.currentOperation
      ? captureRepositorySnapshot(repoRoot, {excludePaths: state.currentOperation.writePaths})
      : snapshot;
    const status = generateStatusData(state, {
      hashes: checked.hashes,
      snapshot,
      operationSnapshot,
      specStatus: checked.artifacts.spec?.status ?? "missing",
      tasksModel: checked.artifacts.tasks,
    });
    process.stdout.write(`${JSON.stringify({ok: true, deterministicChecksPass: checked.ok, checkErrors: checked.errors, status})}\n`);
    return;
  }
  const expected = Number(required(options, "expected-revision"));
  if (!Number.isInteger(expected)) throw new DuckbillError("INVALID_ARGUMENT", "expected revision must be an integer");
  if (command === "begin") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: true, tasks: true});
    if (!checked.ok) throw new DuckbillError("ARTIFACT_CHECK_FAILED", "cannot begin with invalid artifacts", {errors: checked.errors});
    const current = loadState(statePath);
    if (current.revision !== expected) throw new DuckbillError("REVISION_CONFLICT", `expected revision ${expected}, found ${current.revision}`);
    const taskDefinition = checked.artifacts.tasks.tasks.find((task) => task.id === required(options, "task"));
    if (!taskDefinition) throw new DuckbillError("TASK_NOT_FOUND", `unknown task: ${options.task}`);
    const dependencyEvidence = taskDefinition.dependencies.flatMap((id) => Object.values(current.tasks[id]?.evidence ?? {}));
    const preflightEvidence = [...Object.values(current.prerequisites), ...dependencyEvidence];
    const preflightMap = Object.fromEntries(preflightEvidence.map((record, index) => [`preflight-${index}`, record]));
    const writePaths = options["write-paths"] ? JSON.parse(options["write-paths"]) : [];
    if (!Array.isArray(writePaths)) throw new DuckbillError("INVALID_ARGUMENT", "write-paths must be a JSON array");
    for (const path of writePaths) validateRepositoryPath(repoRoot, path);
    const snapshot = captureRepositorySnapshot(repoRoot, {
      observedPaths: unique(preflightEvidence.flatMap((record) => record.observedPaths ?? [])),
      excludePaths: writePaths.map(normalizeRepositoryPath),
    });
    assertEvidenceSnapshot(preflightMap, checked.hashes, snapshot);
    const state = commitMutation(statePath, expected, (currentState) => beginOperation(currentState, {
      type: required(options, "type"),
      taskId: required(options, "task"),
      command: required(options, "command"),
      feedback: options.feedback ?? null,
      feedbackReferences: options["feedback-references"] ? JSON.parse(options["feedback-references"]) : [],
      writePaths,
      repositorySnapshot: snapshot,
      tasksModel: checked.artifacts.tasks,
    }));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision, state})}\n`);
    return;
  }
  if (command === "finish") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: true, tasks: true});
    if (!checked.ok) throw new DuckbillError("ARTIFACT_CHECK_FAILED", "cannot finish with invalid artifacts", {errors: checked.errors});
    const taskId = required(options, "task");
    const definition = checked.artifacts.tasks.tasks.find((task) => task.id === taskId);
    if (!definition) throw new DuckbillError("TASK_NOT_FOUND", `unknown task: ${taskId}`);
    const taskEvidence = evidenceJson(options);
    const snapshot = captureRepositorySnapshot(repoRoot, {observedPaths: unique(Object.values(taskEvidence).flatMap((item) => item.observedPaths ?? []))});
    assertEvidenceSnapshot(taskEvidence, checked.hashes, snapshot);
    const requestedOutcome = options.outcome ?? "auto";
    const outcome = requestedOutcome === "auto" ? deriveTaskOutcome({
      implementationStatus: options["implementation-status"] ?? "completed",
      evidence: taskEvidence,
      boundaryOk: options["boundary-ok"] !== "false",
      ownershipConflict: options["ownership-conflict"] === "true",
    }) : requestedOutcome;
    const state = commitMutation(statePath, expected, (current) => finishOperation(current, {taskId, outcome, evidence: taskEvidence, expectedCheckIds: definition.checks.map((check) => check.id)}));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision, state})}\n`);
    return;
  }
  if (command === "clarify") {
    const context = JSON.parse(required(options, "context"));
    context.startedFrom = currentArtifactHashes(repoRoot, paths);
    const state = commitMutation(statePath, expected, (current) => saveClarification(current, context));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision, state})}\n`);
    return;
  }
  if (command === "resume") {
    const result = commitMutation(statePath, expected, (current) => resumeClarification(
      current,
      JSON.parse(required(options, "answers")),
      currentArtifactHashes(repoRoot, paths),
    ));
    process.stdout.write(`${JSON.stringify({ok: true, revision: result.state.revision, stale: result.stale, complete: result.complete, context: result.context})}\n`);
    return;
  }
  if (command === "abandon") {
    const current = loadState(statePath);
    if (current.revision !== expected) throw new DuckbillError("REVISION_CONFLICT", `expected revision ${expected}, found ${current.revision}`);
    if (!current.currentOperation) {
      process.stdout.write(`${JSON.stringify({ok: true, changed: false, revision: current.revision, state: current})}\n`);
      return;
    }
    const state = commitMutation(statePath, expected, (current) => abandonInvalidatedOperation(current, options.reason ?? "operation-invalidated"));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision, state})}\n`);
    return;
  }
  if (command === "reconcile") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: true, tasks: true});
    if (!checked.ok) throw new DuckbillError("ARTIFACT_CHECK_FAILED", "cannot reconcile invalid artifacts", {errors: checked.errors});
    const result = commitMutation(statePath, expected, (current) => reconcileTasks(current, {
      oldSpec: readOptionalArtifact(options["old-spec"], parseSpec),
      newSpec: checked.artifacts.spec,
      oldPlan: readOptionalArtifact(options["old-plan"], parsePlan),
      newPlan: checked.artifacts.plan,
      oldTasks: readOptionalArtifact(options["old-tasks"], parseTasks),
      newTasks: checked.artifacts.tasks,
      hashes: checked.hashes,
      repository: captureRepositorySnapshot(repoRoot),
      agentAffectedTaskIds: options.affected && options.affected !== "none" ? options.affected.split(",") : [],
    }));
    process.stdout.write(`${JSON.stringify({ok: true, revision: result.state.revision, affectedTaskIds: result.affectedTaskIds})}\n`);
    return;
  }
  if (command === "record-spec") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: false, tasks: false});
    if (!checked.ok || checked.artifacts.spec.status !== "ready") throw new DuckbillError("ARTIFACT_CHECK_FAILED", "specification must be deterministic-valid and ready", {errors: checked.errors});
    const snapshot = captureRepositorySnapshot(repoRoot);
    const state = commitMutation(statePath, expected, (current) => recordSpecification(current, {specHash: checked.hashes.specHash, repository: snapshot}));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision})}\n`);
    return;
  }
  if (command === "invalidate-spec") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: false, tasks: false});
    if (!checked.ok) throw new DuckbillError("ARTIFACT_CHECK_FAILED", "cannot persist an invalid specification", {errors: checked.errors});
    const oldSpec = readOptionalArtifact(required(options, "old-spec"), parseSpec);
    const tasksPath = safeJoin(repoRoot, paths.tasks);
    const tasksModel = existsSync(tasksPath) ? parseTasks(readFileSync(tasksPath, "utf8"), {path: paths.tasks}).model : null;
    const result = commitMutation(statePath, expected, (current) => invalidateAfterSpecChange(current, {
      oldSpec,
      newSpec: checked.artifacts.spec,
      tasksModel,
      specHash: checked.hashes.specHash,
    }));
    process.stdout.write(`${JSON.stringify({ok: true, revision: result.state.revision, affectedTaskIds: result.affectedTaskIds})}\n`);
    return;
  }
  if (command === "record-prerequisites") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: true, tasks: true});
    if (!checked.ok) throw new DuckbillError("ARTIFACT_CHECK_FAILED", "cannot record prerequisites for invalid artifacts", {errors: checked.errors});
    const prerequisiteEvidence = options.evidence ? evidenceJson(options) : {};
    const expectedIds = checked.artifacts.tasks.prerequisites.map((item) => item.id);
    const snapshot = captureRepositorySnapshot(repoRoot, {observedPaths: unique(Object.values(prerequisiteEvidence).flatMap((record) => record.observedPaths ?? []))});
    assertEvidenceSnapshot(prerequisiteEvidence, checked.hashes, snapshot);
    const state = commitMutation(statePath, expected, (current) => recordPrerequisites(current, prerequisiteEvidence, expectedIds));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision})}\n`);
    return;
  }
  if (command === "refresh-evidence") {
    const state = commitMutation(statePath, expected, (current) => refreshEvidenceStaleness(current, repoRoot));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision})}\n`);
    return;
  }
  if (command === "record-validation") {
    const checked = checkFeature(repoRoot, featureId, {spec: true, plan: true, tasks: true});
    if (!checked.ok) throw new DuckbillError("ARTIFACT_CHECK_FAILED", "cannot validate invalid artifacts", {errors: checked.errors});
    const validationEvidence = evidenceJson(options);
    const expectedIds = checked.artifacts.tasks.validation.map((item) => item.id).sort();
    if (JSON.stringify(Object.keys(validationEvidence).sort()) !== JSON.stringify(expectedIds)) throw new DuckbillError("INCOMPLETE_EVIDENCE", "validation evidence must include every VAL item", {expectedIds});
    const snapshot = captureRepositorySnapshot(repoRoot, {observedPaths: unique(Object.values(validationEvidence).flatMap((item) => item.observedPaths ?? []))});
    assertEvidenceSnapshot(validationEvidence, checked.hashes, snapshot);
    const prerequisites = featureValidationPrerequisites(loadState(statePath), {hashes: checked.hashes, snapshot, tasksModel: checked.artifacts.tasks});
    if (!prerequisites.ok) throw new DuckbillError("VALIDATION_BLOCKED", "feature validation prerequisites failed", {reasons: prerequisites.reasons});
    const requestedStatus = options.status ?? "auto";
    const status = requestedStatus === "auto" ? deriveValidationStatus(validationEvidence) : requestedStatus;
    const state = commitMutation(statePath, expected, (current) => recordFeatureValidation(current, {status, evidence: validationEvidence}));
    process.stdout.write(`${JSON.stringify({ok: true, revision: state.revision})}\n`);
    return;
  }
  throw new DuckbillError("INVALID_ARGUMENT", "usage: state.mjs read|record-spec|begin|finish|abandon|clarify|resume|reconcile|invalidate-spec|record-prerequisites|refresh-evidence|record-validation|status [options]");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
    process.exitCode = 1;
  }
}
