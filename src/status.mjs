import {existsSync, statSync} from "node:fs";
import {readFeature, safePath} from "./workspace.mjs";

function metadata(source, key) {
  return source?.match(new RegExp(`^${key}:\\s*(.+)$`, "mu"))?.[1]?.trim() ?? null;
}

function tasks(source) {
  if (!source) return {items: [], issues: []};
  const sections = source.split(/^###\s+/mu).slice(1);
  const issues = [];
  const items = sections.map((section, index) => {
    const label = `task ${index + 1}`;
    const id = section.match(/^\*\*ID:\*\*\s*(.+)$/mu)?.[1]?.trim() ?? null;
    const status = section.match(/^\*\*Status:\*\*\s*(.+)$/mu)?.[1]?.trim() ?? null;
    const dependenciesSource = section.match(/^\*\*Dependencies:\*\*\s*(.+)$/mu)?.[1]?.trim() ?? null;
    if (!id) issues.push(`${label} is missing ID`);
    if (!status) issues.push(`${label} is missing Status`);
    else if (!["pending", "completed"].includes(status)) issues.push(`${id ?? label} has invalid Status: ${status}`);
    if (!dependenciesSource) issues.push(`${id ?? label} is missing Dependencies`);
    const dependencies = dependenciesSource
      ? dependenciesSource.split(",").map((item) => item.trim()).filter((item) => item && item !== "none")
      : [];
    return {id, status, dependencies};
  });
  if (sections.length === 0) issues.push("tasks.md contains no tasks");
  const ids = items.map((item) => item.id).filter(Boolean);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate) issues.push(`duplicate task ID: ${duplicate}`);
  const known = new Set(ids);
  for (const item of items) {
    for (const dependency of item.dependencies) {
      if (!known.has(dependency)) issues.push(`${item.id ?? "task"} has unknown dependency: ${dependency}`);
      if (dependency === item.id) issues.push(`${item.id} depends on itself`);
    }
  }
  const byId = new Map(items.filter((item) => item.id).map((item) => [item.id, item]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id) || !byId.has(id)) return false;
    visiting.add(id);
    const cyclic = byId.get(id).dependencies.some(visit);
    visiting.delete(id);
    visited.add(id);
    return cyclic;
  }
  if (ids.some(visit)) issues.push("task dependencies contain a cycle");
  return {items, issues};
}

export function featureStatus(root, featureId) {
  const feature = readFeature(root, featureId);
  const issues = [];
  const rawSpecStatus = metadata(feature.spec, "status");
  const rawPlanStatus = metadata(feature.plan, "status");
  const specStatus = feature.spec ? rawSpecStatus ?? "invalid" : "missing";
  const planStatus = feature.plan ? rawPlanStatus ?? "invalid" : "missing";
  if (feature.spec && !rawSpecStatus) issues.push("spec.md is missing status");
  else if (rawSpecStatus && !["draft", "ready"].includes(rawSpecStatus)) issues.push(`spec.md has invalid status: ${rawSpecStatus}`);
  if (feature.plan && !rawPlanStatus) issues.push("plan.md is missing status");
  else if (rawPlanStatus && rawPlanStatus !== "ready") issues.push(`plan.md has invalid status: ${rawPlanStatus}`);
  if (feature.plan && !feature.tasks) issues.push("tasks.md is missing while plan.md exists");
  if (feature.tasks && !feature.plan) issues.push("plan.md is missing while tasks.md exists");
  const parsedTasks = tasks(feature.tasks);
  issues.push(...parsedTasks.issues);
  const taskList = parsedTasks.items;
  const validTasks = taskList.filter((task) => task.id && ["pending", "completed"].includes(task.status));
  const pending = validTasks.filter((task) => task.status === "pending");
  const completed = new Set(validTasks.filter((task) => task.status === "completed").map((task) => task.id));
  const ready = pending.filter((task) => task.dependencies.every((dependency) => completed.has(dependency)));
  const specTime = existsSync(safePath(root, feature.paths.spec)) ? statSync(safePath(root, feature.paths.spec)).mtimeMs : 0;
  const planTime = existsSync(safePath(root, feature.paths.plan)) ? statSync(safePath(root, feature.paths.plan)).mtimeMs : 0;
  const stalePlan = planStatus === "ready" && specTime > planTime;
  const staleReason = stalePlan ? "spec.md was modified after plan.md" : null;
  let next = null;
  if (issues.length === 0) {
    if (specStatus === "draft") next = `/duck:spec ${featureId}`;
    else if (!feature.plan && !feature.tasks) next = `/duck:plan ${featureId}`;
    else if (stalePlan) next = `/duck:sync ${featureId}`;
    else if (ready.length > 0) next = `/duck:execute ${featureId} <task-id>`;
    else if (pending.length > 0) next = `/duck:analyze ${featureId} all`;
    else next = `/duck:validate ${featureId}`;
  }
  return {
    featureId,
    specStatus,
    planStatus: stalePlan ? "stale" : planStatus,
    staleReason,
    hasPlan: Boolean(feature.plan),
    hasTasks: Boolean(feature.tasks),
    tasks: taskList,
    pending,
    ready,
    issues,
    paths: feature.paths,
    git: feature.git,
    next,
  };
}

export function prepareAction(action, status, input) {
  if (status.issues.length > 0) throw new Error(`feature artifacts are invalid: ${status.issues.join("; ")}`);
  if (status.specStatus === "missing") throw new Error(`feature ${status.featureId} has no specification`);
  if (action === "spec" && status.specStatus !== "draft") throw new Error("/duck:spec requires a draft specification; use /duck:refine <feature> spec <feedback>");
  if (action === "plan") {
    if (status.specStatus !== "ready") throw new Error("the specification must be ready first; run /duck:spec");
    if (status.hasPlan || status.hasTasks) throw new Error("plan or tasks already exist; use /duck:sync or /duck:refine <feature> plan <feedback>");
  }
  if (["sync", "execute", "validate"].includes(action) && status.specStatus !== "ready") {
    throw new Error("the specification must be ready first; run /duck:spec");
  }
  if (["sync", "execute", "validate"].includes(action) && (!status.hasPlan || !status.hasTasks)) {
    throw new Error("plan.md and tasks.md are required; run /duck:plan");
  }
  if (action === "analyze" && input.scope === "all" && (!status.hasPlan || !status.hasTasks)) {
    throw new Error("whole-feature analysis requires plan.md and tasks.md");
  }
  if (action === "analyze" && input.scope === "all" && status.specStatus !== "ready") throw new Error("whole-feature analysis requires a ready specification");
  if (["execute", "validate"].includes(action) && status.planStatus === "stale") throw new Error(`plan is stale: ${status.staleReason}; run /duck:sync`);
  if (action === "execute") validateTask(status, input.taskId, false);
  if (action === "validate" && status.pending.length > 0) throw new Error("complete all tasks before feature validation");
  if (action === "refine") {
    if (input.scope === "spec" && status.specStatus !== "ready") throw new Error("spec refinement requires a ready specification; use /duck:spec for a draft");
    if (["plan", "code"].includes(input.scope) && (!status.hasPlan || !status.hasTasks)) throw new Error("plan.md and tasks.md are required for this refinement scope");
    if (input.scope === "code" && status.planStatus === "stale") throw new Error(`plan is stale: ${status.staleReason}; run /duck:sync`);
    if (input.scope === "code") validateTask(status, input.taskId, true);
  }
  return input;
}

function validateTask(status, taskId, allowCompleted) {
  const selected = status.tasks.find((task) => task.id === taskId);
  if (!selected) throw new Error(`unknown task: ${taskId}`);
  if (!allowCompleted && selected.status === "completed") throw new Error(`task is already completed: ${selected.id}`);
  const completed = new Set(status.tasks.filter((task) => task.status === "completed").map((task) => task.id));
  const blockedBy = selected.dependencies.filter((dependency) => !completed.has(dependency));
  if (blockedBy.length) throw new Error(`task ${selected.id} is blocked by: ${blockedBy.join(", ")}`);
}

export function renderStatus(status) {
  return [
    `Feature: ${status.featureId}`,
    `Specification: ${status.specStatus}`,
    `Plan: ${status.planStatus}`,
    status.staleReason ? `Plan reason: ${status.staleReason}` : null,
    `Tasks: ${status.tasks.filter((task) => task.status === "completed").length}/${status.tasks.length} completed`,
    `Ready tasks: ${status.ready.map((task) => task.id).join(", ") || "none"}`,
    `Issues: ${status.issues.join("; ") || "none"}`,
    `Git: ${status.git.dirty === null ? "unavailable" : status.git.dirty ? `${status.git.changes.length} uncommitted change(s)` : "clean"}`,
    `Next: ${status.next ?? "none"}`,
  ].filter(Boolean).join("\n");
}

export {metadata, tasks};
