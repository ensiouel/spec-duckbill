import {lstatSync, readFileSync} from "node:fs";
import {dirname, relative, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {readFeature} from "./workspace.mjs";

const assetsRoot = resolve(dirname(dirname(fileURLToPath(import.meta.url))), "assets");

const PROMPTS = Object.freeze({
  spec: ["prompts/spec.md", "skills/specification/SKILL.md", "skills/specification/references/format.md", "skills/specification/references/authoring.md", "skills/specification/references/clarification.md"],
  plan: ["prompts/plan.md", "skills/plan/SKILL.md", "skills/plan/references/formats.md", "skills/plan/references/authoring.md", "skills/plan/references/clarification.md", "templates/plan.md", "templates/tasks.md"],
  "analyze-spec": ["prompts/analyze.md", "skills/specification/SKILL.md", "skills/specification/references/analysis.md"],
  "analyze-all": ["prompts/analyze.md", "skills/consistency/SKILL.md", "skills/consistency/references/hierarchy-and-coverage.md", "skills/consistency/references/analysis.md"],
  sync: ["prompts/sync.md", "skills/consistency/SKILL.md", "skills/consistency/references/synchronization.md", "skills/plan/SKILL.md", "skills/plan/references/synchronization.md"],
  execute: ["prompts/execute.md", "skills/execution/SKILL.md", "skills/execution/references/execution-and-repair.md", "skills/execution/references/boundaries.md", "skills/execution/references/conflicts.md"],
  "refine-spec": ["prompts/refine.md", "skills/specification/SKILL.md", "skills/specification/references/refinement.md"],
  "refine-plan": ["prompts/refine.md", "skills/plan/SKILL.md", "skills/plan/references/refinement.md"],
  "refine-code": ["prompts/refine.md", "skills/execution/SKILL.md", "skills/execution/references/execution-and-repair.md", "skills/execution/references/conflicts.md"],
  validate: ["prompts/validate.md", "skills/validation/SKILL.md", "skills/validation/references/validation.md", "skills/validation/references/staleness.md"],
});

export function loadAsset(path) {
  const absolute = resolve(assetsRoot, path);
  const relation = relative(assetsRoot, absolute);
  if (relation === ".." || relation.startsWith(`..${sep}`)) throw new Error(`asset leaves the package: ${path}`);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`asset is not a regular file: ${path}`);
  return readFileSync(absolute, "utf8");
}

function promptKey(action, input) {
  if (action === "analyze") return `analyze-${input.scope}`;
  if (action === "refine") return `refine-${input.scope}`;
  return action;
}

export function resourcesFor(action, input = {}) {
  const resources = PROMPTS[promptKey(action, input)];
  if (!resources) throw new Error(`unknown Duckbill action: ${action}`);
  return [...resources];
}

export function buildPrompt({action, root, featureId, input, status}) {
  const feature = readFeature(root, featureId);
  const resources = resourcesFor(action, input);
  const material = resources.map((path) => `<resource path="${path}">\n${loadAsset(path)}\n</resource>`).join("\n\n");
  return [
    `Run Duckbill action: ${action}.`,
    `Feature: ${featureId}`,
    `Request: ${JSON.stringify(input)}`,
    `Current status: ${JSON.stringify({spec: status.specStatus, plan: status.planStatus, staleReason: status.staleReason, pendingTasks: status.pending.map((task) => task.id), readyTasks: status.ready.map((task) => task.id), issues: status.issues})}`,
    `Project files: ${JSON.stringify(feature.paths)}`,
    feature.git.dirty === null
      ? "The Git worktree status is unavailable. Do not assume it is clean."
      : feature.git.dirty
        ? `The Git worktree already has changes. Preserve unrelated work: ${feature.git.changes.join(", ")}`
        : "The Git worktree is clean.",
    "Use normal Pi tools. Read the project files you need, make only changes owned by this action, run relevant project checks, and summarize changed files and checks. Do not start the suggested next action automatically.",
    material,
  ].join("\n\n");
}
