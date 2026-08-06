import {buildPrompt} from "./prompts.mjs";
import {findRepositoryRoot, initializeFeature, parseCommand, resolveFeature} from "./workspace.mjs";
import {featureStatus, prepareAction, renderStatus} from "./status.mjs";

const ACTIONS = [
  ["init", "Create a feature workspace"],
  ["spec", "Develop the feature specification"],
  ["analyze", "Analyze specification or full feature consistency"],
  ["plan", "Create the technical plan and tasks"],
  ["sync", "Synchronize plan and tasks with the specification"],
  ["execute", "Execute one ready task"],
  ["refine", "Refine specification, plan, or implementation"],
  ["validate", "Validate the implemented feature"],
  ["status", "Show current feature status"],
];

function message(content) {
  return {customType: "spec-duckbill", content, display: true};
}

function help() {
  return [
    "Duckbill commands:",
    "/duck:init <feature> [description]",
    "/duck:spec <feature> [description]",
    "/duck:analyze <feature> <spec|all>",
    "/duck:plan <feature> [description]",
    "/duck:sync <feature> [description]",
    "/duck:execute <feature> <task-id> [description]",
    "/duck:refine <feature> spec <feedback>",
    "/duck:refine <feature> plan <feedback>",
    "/duck:refine <feature> code <task-id> <feedback>",
    "/duck:validate <feature> [description]",
    "/duck:status <feature>",
  ].join("\n");
}

function send(pi, content) {
  pi.sendMessage(message(content), {triggerTurn: false});
}

export default function specDuckbill(pi) {
  pi.registerCommand("duck", {
    description: "Show Duckbill help or an explicitly named feature status",
    handler: async (raw, ctx) => {
      if (String(raw ?? "").trim()) return send(pi, "/duck does not accept arguments; use /duck:status <feature>");
      return send(pi, help());
    },
  });

  for (const [action, description] of ACTIONS) {
    pi.registerCommand(`duck:${action}`, {
      description,
      handler: async (raw, ctx) => {
        try {
          if (action === "init") {
            const input = parseCommand(action, raw);
            return send(pi, initializeFeature(ctx.cwd, input.featureId, input.description));
          }
          if (action === "status") return showStatus(pi, ctx.cwd, raw);
          if (typeof ctx.isIdle === "function" && !ctx.isIdle()) throw new Error("wait for the current agent turn to finish");
          const root = findRepositoryRoot(ctx.cwd);
          const featureId = resolveFeature(root, raw);
          let input = parseCommand(action, raw, {root, featureId});
          const status = featureStatus(root, featureId);
          input = prepareAction(action, status, input);
          pi.sendUserMessage(buildPrompt({action, root, featureId, input, status}));
        } catch (error) {
          send(pi, `Duckbill could not start: ${error.message}`);
        }
      },
    });
  }
}

function showStatus(pi, cwd, raw) {
  try {
    const root = findRepositoryRoot(cwd);
    const featureId = resolveFeature(root, raw);
    parseCommand("status", raw, {root, featureId});
    send(pi, renderStatus(featureStatus(root, featureId)));
  } catch (error) {
    send(pi, `Duckbill status unavailable: ${error.message}`);
  }
}

export {help};
