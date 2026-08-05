#!/usr/bin/env node

import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {
  DuckbillError,
  errorPayload,
  hashText,
  normalizeText,
  parseFrontmatter,
  safeJoin,
} from "./utils.mjs";

export const FEATURE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const NUMERIC_ID_PATTERN = /\b(?:US|FR|NFR|AC|OUT|PRE|CHK|VAL)-\d{3}\b/gu;
const SPEC_SECTIONS = [
  "Overview",
  "Actors",
  "User Scenarios",
  "Goals",
  "Non-Goals",
  "Requirements",
  "External Contracts",
  "Data Behavior",
  "Security and Privacy Requirements",
  "Acceptance Criteria",
  "Product Outcomes",
  "Assumptions",
  "References",
];
const PLAN_SECTIONS = [
  "Summary",
  "Technical Context",
  "Architecture",
  "Components and Boundaries",
  "Internal Data Design",
  "Interfaces and Integration",
  "Security Design",
  "Operational Behavior",
  "Testing Strategy",
  "Rollout and Compatibility",
  "Risks and Mitigations",
  "Requirement Mapping",
  "References",
];
const MAPPABLE_PLAN_SECTIONS = new Set(PLAN_SECTIONS.filter((name) => !["Requirement Mapping", "References"].includes(name)));
const TASK_SECTIONS = ["Prerequisites", "Tasks", "Feature Validation"];
const PLACEHOLDER_PATTERNS = [
  {pattern: /\[WRITE HERE\]/iu, label: "[WRITE HERE]"},
  {pattern: /\b(?:TODO|TBD|TK)\b/iu, label: "TODO/TBD/TK"},
  {pattern: /<(?:feature|condition|observable|verified|concrete|coherent|stable|user|business|cross-task|measurable|non-negotiable)[^>]*>/iu, label: "template value"},
];

function finding(code, message, path = null, details = undefined) {
  return {code, message, ...(path ? {path} : {}), ...(details === undefined ? {} : {details})};
}

function unique(values) {
  return [...new Set(values)];
}

function commaList(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function headingSections(body, level = 2) {
  const lines = body.split("\n");
  const prefix = "#".repeat(level);
  const entries = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(new RegExp(`^${prefix}\\s+(.+?)\\s*$`, "u"));
    if (match) entries.push({name: match[1], index});
  }
  return {lines, entries};
}

function sectionBlock(body, name, level = 2) {
  const {lines, entries} = headingSections(body, level);
  const position = entries.findIndex((entry) => entry.name === name);
  if (position < 0) return null;
  const start = entries[position].index + 1;
  const end = position + 1 < entries.length ? entries[position + 1].index : lines.length;
  return {lines, start, end, text: lines.slice(start, end).join("\n")};
}

function validateSections(body, required, path, errors) {
  const {entries} = headingSections(body);
  const names = entries.map((entry) => entry.name);
  for (const name of required) {
    const count = names.filter((candidate) => candidate === name).length;
    if (count === 0) errors.push(finding("MISSING_SECTION", `missing required section: ${name}`, path));
    if (count > 1) errors.push(finding("DUPLICATE_SECTION", `duplicate section: ${name}`, path));
  }
  const positions = required.map((name) => names.indexOf(name)).filter((index) => index >= 0);
  if (positions.some((value, index) => index > 0 && value < positions[index - 1])) {
    errors.push(finding("SECTION_ORDER", "required sections are not in canonical order", path));
  }
}

function validateFrontmatter(attributes, expected, allowed, path, errors) {
  for (const [key, value] of Object.entries(expected)) {
    if (attributes[key] !== value) {
      errors.push(finding("INVALID_FRONTMATTER_VALUE", `${key} must be ${value}`, path, {actual: attributes[key] ?? null}));
    }
  }
  for (const key of Object.keys(attributes)) {
    if (!allowed.includes(key)) errors.push(finding("UNKNOWN_FRONTMATTER_KEY", `unknown frontmatter key: ${key}`, path));
  }
}

function duplicateIds(ids, path, errors) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) errors.push(finding("DUPLICATE_ID", `duplicate ID: ${id}`, path));
    seen.add(id);
  }
}

function unresolvedPlaceholders(source, path, errors) {
  for (const item of PLACEHOLDER_PATTERNS) {
    if (item.pattern.test(source)) errors.push(finding("UNRESOLVED_PLACEHOLDER", `unresolved ${item.label} placeholder`, path));
  }
}

function frontmatterOrError(source, path, errors) {
  try {
    return parseFrontmatter(source);
  } catch (error) {
    errors.push(finding(error.code ?? "INVALID_FRONTMATTER", error.message, path, error.details));
    return null;
  }
}

function definitionBullets(text, prefix) {
  const pattern = new RegExp(`^\\s*-\\s+\\*\\*(${prefix}-\\d{3}):\\*\\*\\s+(.+?)\\s*$`, "gmu");
  return [...text.matchAll(pattern)].map((match) => ({id: match[1], text: match[2]}));
}

function unknownIdReferences(source, knownIds, path, errors) {
  const unknown = unique(source.match(NUMERIC_ID_PATTERN) ?? []).filter((id) => !knownIds.has(id));
  for (const id of unknown) errors.push(finding("UNKNOWN_INTERNAL_REFERENCE", `unknown internal ID reference: ${id}`, path));
}

export function parseSpec(source, options = {}) {
  const path = options.path ?? "spec.md";
  const errors = [];
  const parsed = frontmatterOrError(source, path, errors);
  if (!parsed) return {kind: "spec", path, errors, warnings: [], model: null, hash: hashText(source)};
  const {attributes, body} = parsed;
  const featureId = attributes["feature-id"];
  validateFrontmatter(attributes, {schema: "duckbill/spec@1"}, ["schema", "feature-id", "status", "plan-file"], path, errors);
  if (!FEATURE_ID_PATTERN.test(featureId ?? "")) errors.push(finding("INVALID_FEATURE_ID", "feature-id must be lowercase kebab-case", path));
  if (!["draft", "ready"].includes(attributes.status)) errors.push(finding("INVALID_SPEC_STATUS", "spec status must be draft or ready", path));
  if (featureId && attributes["plan-file"] !== `.duckbill/specs/${featureId}/plan.md`) {
    errors.push(finding("INVALID_CANONICAL_PATH", "plan-file is not canonical for feature-id", path));
  }
  validateSections(body, SPEC_SECTIONS, path, errors);
  const requirements = sectionBlock(body, "Requirements");
  if (requirements) {
    const level3 = headingSections(requirements.text, 3).entries.map((entry) => entry.name);
    for (const name of ["Functional Requirements", "Non-Functional Requirements"]) {
      if (level3.filter((entry) => entry === name).length !== 1) {
        errors.push(finding("MISSING_REQUIREMENT_SUBSECTION", `Requirements must contain one ${name} subsection`, path));
      }
    }
  }

  const scenarioSection = sectionBlock(body, "User Scenarios");
  const scenarios = [];
  if (scenarioSection) {
    const headings = [];
    for (let index = scenarioSection.start; index < scenarioSection.end; index += 1) {
      const match = scenarioSection.lines[index].match(/^###\s+(US-\d{3}):\s+(.+?)\s*$/u);
      if (match) headings.push({id: match[1], title: match[2], index});
    }
    for (let position = 0; position < headings.length; position += 1) {
      const heading = headings[position];
      const end = position + 1 < headings.length ? headings[position + 1].index : scenarioSection.end;
      const text = scenarioSection.lines.slice(heading.index + 1, end).join("\n");
      const priority = text.match(/^\*\*Priority:\*\*\s*(P[1-3])\s*$/mu)?.[1] ?? null;
      const value = text.match(/^\*\*Value:\*\*\s*(\S.+?)\s*$/mu)?.[1] ?? null;
      const independentTest = text.match(/^\*\*Independent Test:\*\*\s*(\S.+?)\s*$/mu)?.[1] ?? null;
      const acceptanceHeading = /^\*\*Acceptance Scenarios:\*\*\s*$/mu.test(text);
      const acceptanceItems = acceptanceHeading
        ? text.slice(text.search(/^\*\*Acceptance Scenarios:\*\*\s*$/mu)).match(/^\s*-\s+\S.+$/gmu) ?? []
        : [];
      if (!priority || !value || !independentTest || acceptanceItems.length === 0) {
        errors.push(finding("INVALID_USER_SCENARIO", `${heading.id} requires Priority, Value, Independent Test, and acceptance scenarios`, path));
      }
      scenarios.push({...heading, priority, value, independentTest, text});
    }
    if (headings.length === 0) errors.push(finding("MISSING_USER_SCENARIO", "specification requires at least one US-### scenario", path));
  }

  const fr = definitionBullets(requirements ? sectionBlock(requirements.text, "Functional Requirements", 3)?.text ?? "" : "", "FR");
  const nfr = definitionBullets(requirements ? sectionBlock(requirements.text, "Non-Functional Requirements", 3)?.text ?? "" : "", "NFR");
  const ac = definitionBullets(sectionBlock(body, "Acceptance Criteria")?.text ?? "", "AC");
  const outcomes = definitionBullets(sectionBlock(body, "Product Outcomes")?.text ?? "", "OUT");
  for (const [label, values] of [["FR", fr], ["NFR", nfr], ["AC", ac], ["OUT", outcomes]]) {
    if (values.length === 0) errors.push(finding("MISSING_NORMATIVE_ID", `specification requires at least one ${label}-### item`, path));
  }
  const ids = [...scenarios.map((item) => item.id), ...fr.map((item) => item.id), ...nfr.map((item) => item.id), ...ac.map((item) => item.id), ...outcomes.map((item) => item.id)];
  duplicateIds(ids, path, errors);
  unknownIdReferences(body, new Set(ids), path, errors);
  unresolvedPlaceholders(source, path, errors);

  const implementationPatterns = [
    /(?:^|[\s`])(?:src|lib|app|apps|packages|test|tests)\/[A-Za-z0-9_.\/-]+/mu,
    /`[^`\n]+\.(?:js|mjs|cjs|ts|tsx|jsx|go|rs|py|java|kt|swift)`/iu,
    /\b(?:implement|create|modify)\s+(?:the\s+)?(?:class|function|module|file|component)\b/iu,
    /\b(?:use|using)\s+(?:the\s+)?(?:library|framework|package)\b/iu,
  ];
  if (implementationPatterns.some((pattern) => pattern.test(body))) {
    errors.push(finding("IMPLEMENTATION_DETAIL_IN_SPEC", "specification contains deterministic signs of internal implementation design", path));
  }

  const idHashes = Object.fromEntries([
    ...scenarios.map((item) => [item.id, hashText(JSON.stringify({title: item.title, text: item.text}))]),
    ...fr.map((item) => [item.id, hashText(item.text)]),
    ...nfr.map((item) => [item.id, hashText(item.text)]),
    ...ac.map((item) => [item.id, hashText(item.text)]),
  ]);
  const model = {
    featureId,
    status: attributes.status,
    planFile: attributes["plan-file"],
    scenarios,
    functionalRequirements: fr,
    nonFunctionalRequirements: nfr,
    acceptanceCriteria: ac,
    outcomes,
    idHashes,
    allCoverageIds: [...scenarios.map((item) => item.id), ...fr.map((item) => item.id), ...nfr.map((item) => item.id), ...ac.map((item) => item.id)],
  };
  return {kind: "spec", path, errors, warnings: [], model, hash: hashText(source)};
}

export function parsePlan(source, options = {}) {
  const path = options.path ?? "plan.md";
  const errors = [];
  const parsed = frontmatterOrError(source, path, errors);
  if (!parsed) return {kind: "plan", path, errors, warnings: [], model: null, hash: hashText(source)};
  const {attributes, body} = parsed;
  const featureId = attributes["feature-id"];
  validateFrontmatter(attributes, {schema: "duckbill/plan@1", status: "ready"}, ["schema", "feature-id", "status", "spec-file", "tasks-file"], path, errors);
  if (!FEATURE_ID_PATTERN.test(featureId ?? "")) errors.push(finding("INVALID_FEATURE_ID", "feature-id must be lowercase kebab-case", path));
  if (featureId) {
    if (attributes["spec-file"] !== `.duckbill/specs/${featureId}/spec.md`) errors.push(finding("INVALID_CANONICAL_PATH", "spec-file is not canonical", path));
    if (attributes["tasks-file"] !== `.duckbill/specs/${featureId}/tasks.md`) errors.push(finding("INVALID_CANONICAL_PATH", "tasks-file is not canonical", path));
  }
  validateSections(body, PLAN_SECTIONS, path, errors);
  if (/^\s*-\s+\[[ xX]\]\s+/mu.test(body)) errors.push(finding("CHECKBOX_FORBIDDEN", "plan must not contain checkboxes", path));
  if (/^(?:#{1,6}\s+Execution(?: State)?|\*\*(?:Attempts?|Evidence|Current (?:Task|Operation)):\*\*)/imu.test(body)) {
    errors.push(finding("RUNTIME_STATE_FORBIDDEN", "plan must not contain execution state or evidence", path));
  }
  unresolvedPlaceholders(source, path, errors);

  const mappings = new Map();
  const mappingBlock = sectionBlock(body, "Requirement Mapping");
  if (mappingBlock) {
    for (const line of mappingBlock.text.split("\n")) {
      if (!line.trim()) continue;
      const match = line.match(/^\s*-\s+\*\*((?:US|FR|NFR|AC)-\d{3}):\*\*\s+(.+?)\s*$/u);
      if (!match) {
        errors.push(finding("INVALID_PLAN_MAPPING", `invalid Requirement Mapping item: ${line.trim()}`, path));
        continue;
      }
      const targets = commaList(match[2]);
      if (mappings.has(match[1])) errors.push(finding("DUPLICATE_ID", `duplicate mapping ID: ${match[1]}`, path));
      if (targets.length === 0 || targets.some((target) => !MAPPABLE_PLAN_SECTIONS.has(target))) {
        errors.push(finding("UNKNOWN_PLAN_SECTION", `mapping ${match[1]} contains an unknown or forbidden plan section`, path, {targets}));
      }
      mappings.set(match[1], targets);
    }
  }
  const sectionHashes = Object.fromEntries(PLAN_SECTIONS.map((name) => [name, hashText(sectionBlock(body, name)?.text ?? "")]));
  const idConstraintHashes = Object.fromEntries([...mappings.entries()].map(([id, targets]) => [
    id,
    hashText(JSON.stringify(targets.map((target) => [target, sectionHashes[target]]))),
  ]));
  const model = {
    featureId,
    status: attributes.status,
    specFile: attributes["spec-file"],
    tasksFile: attributes["tasks-file"],
    mappings,
    sectionHashes,
    idConstraintHashes,
  };
  return {kind: "plan", path, errors, warnings: [], model, hash: hashText(source)};
}

function taskField(text, name) {
  return text.match(new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+?)\\s*$`, "mu"))?.[1] ?? null;
}

function labelledBlock(text, name, nextNames) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `**${name}:**`);
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (nextNames.some((next) => lines[index].trim() === `**${next}:**`)) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

export function parseTasks(source, options = {}) {
  const path = options.path ?? "tasks.md";
  const errors = [];
  const parsed = frontmatterOrError(source, path, errors);
  if (!parsed) return {kind: "tasks", path, errors, warnings: [], model: null, hash: hashText(source)};
  const {attributes, body} = parsed;
  const featureId = attributes["feature-id"];
  validateFrontmatter(attributes, {schema: "duckbill/tasks@1"}, ["schema", "feature-id", "spec-file", "plan-file"], path, errors);
  if (!FEATURE_ID_PATTERN.test(featureId ?? "")) errors.push(finding("INVALID_FEATURE_ID", "feature-id must be lowercase kebab-case", path));
  if (featureId) {
    if (attributes["spec-file"] !== `.duckbill/specs/${featureId}/spec.md`) errors.push(finding("INVALID_CANONICAL_PATH", "spec-file is not canonical", path));
    if (attributes["plan-file"] !== `.duckbill/specs/${featureId}/plan.md`) errors.push(finding("INVALID_CANONICAL_PATH", "plan-file is not canonical", path));
  }
  validateSections(body, TASK_SECTIONS, path, errors);
  if (/^\s*-\s+\[[ xX]\]\s+/mu.test(body)) errors.push(finding("CHECKBOX_FORBIDDEN", "tasks must not contain checkboxes", path));
  if (/^(?:#{1,6}\s+Execution(?: State)?|\*\*(?:Status|Attempts?|Evidence|Current (?:Task|Operation)):\*\*)/imu.test(body)) {
    errors.push(finding("RUNTIME_STATE_FORBIDDEN", "tasks must not contain execution state or evidence", path));
  }
  unresolvedPlaceholders(source, path, errors);

  const prerequisiteText = sectionBlock(body, "Prerequisites")?.text.trim() ?? "";
  const prerequisites = definitionBullets(prerequisiteText, "PRE");
  if (prerequisites.length === 0 && prerequisiteText !== "None.") {
    errors.push(finding("INVALID_PREREQUISITES", "Prerequisites must contain PRE-### items or exact None.", path));
  }
  if (prerequisites.length > 0) {
    const meaningfulLines = prerequisiteText.split("\n").filter((line) => line.trim());
    if (meaningfulLines.length !== prerequisites.length) errors.push(finding("INVALID_PREREQUISITES", "Prerequisites contains non PRE-### content", path));
  }

  const taskSection = sectionBlock(body, "Tasks");
  const taskHeadings = [];
  if (taskSection) {
    for (let index = taskSection.start; index < taskSection.end; index += 1) {
      const match = taskSection.lines[index].match(/^###\s+Task\s+(\d+):\s+(.+?)\s*$/u);
      if (match) taskHeadings.push({number: Number(match[1]), title: match[2], index});
    }
  }
  if (taskHeadings.length === 0) errors.push(finding("MISSING_TASK", "tasks artifact requires at least one task", path));

  const tasks = [];
  const allCheckIds = [];
  for (let position = 0; position < taskHeadings.length; position += 1) {
    const heading = taskHeadings[position];
    const end = position + 1 < taskHeadings.length ? taskHeadings[position + 1].index : taskSection.end;
    const text = taskSection.lines.slice(heading.index + 1, end).join("\n");
    if (heading.number !== position + 1) errors.push(finding("TASK_NUMBER_ORDER", "Task display numbers must be continuous", path));
    const id = taskField(text, "ID");
    const scenarioValue = taskField(text, "User Scenarios");
    const requirementValue = taskField(text, "Requirements");
    const dependencyValue = taskField(text, "Dependencies");
    if (!FEATURE_ID_PATTERN.test(id ?? "")) errors.push(finding("INVALID_TASK_ID", `Task ${heading.number} requires a kebab-case ID`, path));
    const scenarios = scenarioValue ? commaList(scenarioValue) : [];
    if (scenarios.length === 0 || scenarios.some((item) => !/^US-\d{3}$/u.test(item))) {
      errors.push(finding("INVALID_TASK_SCENARIOS", `${id ?? `Task ${heading.number}`} requires US-### mappings`, path));
    }
    const requirements = requirementValue ? commaList(requirementValue) : [];
    if (requirements.length === 0 || requirements.some((item) => !/^(?:FR|NFR|AC)-\d{3}$/u.test(item))) {
      errors.push(finding("INVALID_TASK_REQUIREMENTS", `${id ?? `Task ${heading.number}`} requires FR/NFR/AC mappings`, path));
    }
    const dependencies = dependencyValue === "none" ? [] : dependencyValue ? commaList(dependencyValue) : null;
    if (dependencies === null || dependencies.some((item) => !FEATURE_ID_PATTERN.test(item))) {
      errors.push(finding("INVALID_TASK_DEPENDENCIES", `${id ?? `Task ${heading.number}`} requires task IDs or none`, path));
    }
    const context = labelledBlock(text, "Context", ["Actions", "Checks"]);
    const actions = labelledBlock(text, "Actions", ["Checks"]);
    const checksBlock = labelledBlock(text, "Checks", []);
    if (!context || !/^\s*-\s+\S.+$/mu.test(context)) errors.push(finding("MISSING_TASK_CONTEXT", `${id ?? `Task ${heading.number}`} requires Context items`, path));
    const actionItems = actions?.match(/^\s*\d+\.\s+\S.+$/gmu) ?? [];
    if (actionItems.length === 0) errors.push(finding("MISSING_TASK_ACTIONS", `${id ?? `Task ${heading.number}`} requires Actions`, path));
    const checks = definitionBullets(checksBlock ?? "", "CHK");
    if (checks.length === 0) errors.push(finding("MISSING_TASK_CHECKS", `${id ?? `Task ${heading.number}`} requires Checks`, path));
    allCheckIds.push(...checks.map((check) => check.id));
    tasks.push({
      id,
      title: heading.title,
      scenarios,
      requirements,
      dependencies: dependencies ?? [],
      context: context ?? "",
      actions: actionItems.map((item) => item.replace(/^\s*\d+\.\s+/u, "")),
      checks,
      fingerprint: hashText(JSON.stringify({scenarios, requirements, dependencies: dependencies ?? [], context, actions: actionItems, checks})),
    });
  }

  const validationText = sectionBlock(body, "Feature Validation")?.text ?? "";
  const validation = [];
  for (const line of validationText.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*-\s+\*\*(VAL-\d{3}):\*\*\s+\[((?:\s*(?:US|FR|NFR|AC)-\d{3}\s*,?)+)\]\s+(\S.+?)\s*$/u);
    if (!match) {
      errors.push(finding("INVALID_VALIDATION_MAPPING", `validation item requires VAL ID, explicit mappings, and text: ${line.trim()}`, path));
      continue;
    }
    validation.push({id: match[1], mappings: commaList(match[2]), text: match[3]});
  }
  if (validation.length === 0) errors.push(finding("MISSING_FEATURE_VALIDATION", "tasks requires at least one VAL-### item", path));

  const taskIds = tasks.map((task) => task.id).filter(Boolean);
  duplicateIds(taskIds, path, errors);
  duplicateIds([...prerequisites.map((item) => item.id), ...allCheckIds, ...validation.map((item) => item.id)], path, errors);
  const model = {
    featureId,
    specFile: attributes["spec-file"],
    planFile: attributes["plan-file"],
    prerequisites,
    tasks,
    validation,
  };
  return {kind: "tasks", path, errors, warnings: [], model, hash: hashText(source)};
}

function validateKnownMappings(spec, plan, tasks, errors) {
  if (!spec || !plan || !tasks) return;
  const known = new Set(spec.allCoverageIds);
  for (const id of plan.mappings.keys()) {
    if (!known.has(id)) errors.push(finding("UNKNOWN_PLAN_MAPPING", `plan maps unknown specification ID: ${id}`));
  }
  for (const task of tasks.tasks) {
    for (const id of task.scenarios) if (!known.has(id)) errors.push(finding("UNKNOWN_SCENARIO_MAPPING", `${task.id} maps unknown scenario: ${id}`));
    for (const id of task.requirements) if (!known.has(id)) errors.push(finding("UNKNOWN_REQUIREMENT_MAPPING", `${task.id} maps unknown requirement: ${id}`));
  }
  for (const item of tasks.validation) {
    for (const id of item.mappings) if (!known.has(id)) errors.push(finding("UNKNOWN_VALIDATION_MAPPING", `${item.id} maps unknown specification ID: ${id}`));
  }
}

function validateDependencies(tasks, errors) {
  if (!tasks) return;
  const ids = new Set(tasks.tasks.map((task) => task.id));
  const graph = new Map(tasks.tasks.map((task) => [task.id, task.dependencies]));
  for (const task of tasks.tasks) {
    for (const dependency of task.dependencies) {
      if (dependency === task.id) errors.push(finding("SELF_DEPENDENCY", `${task.id} depends on itself`));
      else if (!ids.has(dependency)) errors.push(finding("UNKNOWN_DEPENDENCY", `${task.id} depends on unknown task: ${dependency}`));
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function visit(id) {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      errors.push(finding("DEPENDENCY_CYCLE", `task dependency cycle: ${[...stack.slice(start), id].join(" -> ")}`));
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    stack.push(id);
    for (const dependency of graph.get(id) ?? []) if (graph.has(dependency)) visit(dependency);
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of graph.keys()) visit(id);
}

function validateCoverage(spec, plan, tasks, errors) {
  if (!spec || !plan || !tasks) return;
  const taskScenarioCoverage = new Set(tasks.tasks.flatMap((task) => task.scenarios));
  const taskRequirementCoverage = new Set(tasks.tasks.flatMap((task) => task.requirements));
  const validationCoverage = new Set(tasks.validation.flatMap((item) => item.mappings));
  for (const id of spec.allCoverageIds) {
    if (!plan.mappings.has(id)) errors.push(finding("MISSING_PLAN_COVERAGE", `specification ID lacks plan coverage: ${id}`));
    const taskCovered = id.startsWith("US-") ? taskScenarioCoverage.has(id) : taskRequirementCoverage.has(id);
    if (!taskCovered) errors.push(finding("MISSING_TASK_COVERAGE", `specification ID lacks task coverage: ${id}`));
    if (!validationCoverage.has(id)) errors.push(finding("MISSING_VALIDATION_COVERAGE", `specification ID lacks VAL coverage: ${id}`));
  }
}

export function checkArtifacts(input) {
  const specResult = input.specSource === undefined ? null : parseSpec(input.specSource, {path: input.specPath});
  const planResult = input.planSource === undefined ? null : parsePlan(input.planSource, {path: input.planPath});
  const tasksResult = input.tasksSource === undefined ? null : parseTasks(input.tasksSource, {path: input.tasksPath});
  const results = [specResult, planResult, tasksResult].filter(Boolean);
  const errors = results.flatMap((result) => result.errors);
  const warnings = results.flatMap((result) => result.warnings);
  const spec = specResult?.model;
  const plan = planResult?.model;
  const tasks = tasksResult?.model;

  if (spec && plan && spec.featureId !== plan.featureId) errors.push(finding("MISMATCHED_FEATURE_ID", "spec and plan feature IDs differ"));
  if (spec && tasks && spec.featureId !== tasks.featureId) errors.push(finding("MISMATCHED_FEATURE_ID", "spec and tasks feature IDs differ"));
  if (plan && tasks && plan.featureId !== tasks.featureId) errors.push(finding("MISMATCHED_FEATURE_ID", "plan and tasks feature IDs differ"));
  if (spec && plan && spec.planFile !== input.planPath) errors.push(finding("INVALID_RECIPROCAL_LINK", "spec plan-file does not point to loaded plan"));
  if (plan && spec && plan.specFile !== input.specPath) errors.push(finding("INVALID_RECIPROCAL_LINK", "plan spec-file does not point to loaded spec"));
  if (plan && tasks && plan.tasksFile !== input.tasksPath) errors.push(finding("INVALID_RECIPROCAL_LINK", "plan tasks-file does not point to loaded tasks"));
  if (tasks && spec && tasks.specFile !== input.specPath) errors.push(finding("INVALID_RECIPROCAL_LINK", "tasks spec-file does not point to loaded spec"));
  if (tasks && plan && tasks.planFile !== input.planPath) errors.push(finding("INVALID_RECIPROCAL_LINK", "tasks plan-file does not point to loaded plan"));

  validateKnownMappings(spec, plan, tasks, errors);
  validateDependencies(tasks, errors);
  validateCoverage(spec, plan, tasks, errors);
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    artifacts: {spec, plan, tasks},
    hashes: {
      specHash: specResult?.hash ?? null,
      planHash: planResult?.hash ?? null,
      tasksHash: tasksResult?.hash ?? null,
    },
  };
}

export function canonicalFeaturePaths(featureId) {
  if (!FEATURE_ID_PATTERN.test(featureId)) throw new DuckbillError("INVALID_FEATURE_SLUG", "feature must be lowercase kebab-case");
  const base = `.duckbill/specs/${featureId}`;
  return {
    constitution: ".duckbill/constitution.md",
    directory: base,
    spec: `${base}/spec.md`,
    plan: `${base}/plan.md`,
    tasks: `${base}/tasks.md`,
    state: `${base}/state.json`,
  };
}

export function loadFeatureArtifacts(repoRoot, featureId, options = {}) {
  const paths = canonicalFeaturePaths(featureId);
  const load = (path, mode) => {
    if (mode === false) return undefined;
    const absolute = safeJoin(repoRoot, path);
    if (!existsSync(absolute)) {
      if (mode === true) throw new DuckbillError("ARTIFACT_NOT_FOUND", `required artifact does not exist: ${path}`);
      return undefined;
    }
    return readFileSync(absolute, "utf8");
  };
  return {
    paths,
    specSource: load(paths.spec, options.spec ?? true),
    planSource: load(paths.plan, options.plan ?? false),
    tasksSource: load(paths.tasks, options.tasks ?? false),
  };
}

export function checkFeature(repoRoot, featureId, options = {}) {
  const loaded = loadFeatureArtifacts(repoRoot, featureId, options);
  return checkArtifacts({
    specSource: loaded.specSource,
    planSource: loaded.planSource,
    tasksSource: loaded.tasksSource,
    specPath: loaded.paths.spec,
    planPath: loaded.paths.plan,
    tasksPath: loaded.paths.tasks,
  });
}

export function compareArtifactHashes(stored, current) {
  const result = {};
  for (const name of ["specHash", "planHash", "tasksHash"]) {
    result[name] = stored?.[name] === current?.[name] ? "current" : "stale";
  }
  return result;
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

function main(argv) {
  const {command, options} = parseArgs(argv);
  if (!["spec", "plan", "tasks", "all", "hashes"].includes(command)) {
    throw new DuckbillError("INVALID_ARGUMENT", "usage: check.mjs spec|plan|tasks|all|hashes --repo <root> --feature <id>");
  }
  const repoRoot = resolve(options.repo ?? process.cwd());
  const featureId = options.feature;
  if (!featureId) throw new DuckbillError("INVALID_ARGUMENT", "missing --feature <id>");
  const requirePlan = ["plan", "tasks", "all", "hashes"].includes(command);
  const requireTasks = ["tasks", "all", "hashes"].includes(command);
  const result = checkFeature(repoRoot, featureId, {spec: true, plan: requirePlan, tasks: requireTasks});
  const filtered = command === "hashes" ? {ok: result.ok, hashes: result.hashes, errors: result.errors} : result;
  process.stdout.write(`${JSON.stringify(filtered)}\n`);
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${JSON.stringify(errorPayload(error))}\n`);
    process.exitCode = 1;
  }
}
