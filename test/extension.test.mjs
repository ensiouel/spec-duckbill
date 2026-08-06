import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import specDuckbill from "../src/index.mjs";

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {encoding: "utf8"}).trim();
}

function repository(context) {
  const root = mkdtempSync(join(tmpdir(), "duckbill-extension-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  git(root, "init", "-q");
  return root;
}

function fakePi() {
  const commands = new Map();
  const messages = [];
  return {
    commands,
    messages,
    registerCommand(name, definition) { commands.set(name, definition); },
    sendMessage(value, options) { messages.push({value, options}); },
    sendUserMessage(value) { messages.push({value, user: true}); },
  };
}

test("extension exposes one Duckbill command namespace and no custom tools", () => {
  const pi = fakePi();
  specDuckbill(pi);
  assert.deepEqual([...pi.commands.keys()], [
    "duck", "duck:init", "duck:spec", "duck:analyze", "duck:plan", "duck:sync",
    "duck:execute", "duck:refine", "duck:validate", "duck:status",
  ]);
  assert.equal(typeof pi.registerTool, "undefined");
});

test("root command shows concise help", async () => {
  const pi = fakePi();
  specDuckbill(pi);
  await pi.commands.get("duck").handler("", {cwd: process.cwd()});
  assert.match(pi.messages.at(-1).value.content, /\/duck:init/u);
  assert.match(pi.messages.at(-1).value.content, /\/duck:plan <feature> \[description\]/u);
  await pi.commands.get("duck").handler("safe-feature", {cwd: process.cwd()});
  assert.match(pi.messages.at(-1).value.content, /does not accept arguments/u);
});

test("init is deterministic and semantic commands use a normal Pi turn", async (context) => {
  const root = repository(context);
  const pi = fakePi();
  specDuckbill(pi);
  await pi.commands.get("duck:init").handler("safe-feature Initial behavior", {cwd: root});
  assert.match(pi.messages.at(-1).value.content, /Created safe-feature/u);
  await pi.commands.get("duck:spec").handler("safe-feature", {cwd: root, isIdle: () => true});
  assert.equal(pi.messages.at(-1).user, true);
  assert.match(pi.messages.at(-1).value, /Run Duckbill action: spec/u);
  assert.match(pi.messages.at(-1).value, /Use normal Pi tools/u);
  assert.doesNotMatch(pi.messages.at(-1).value, /duckbill_finish|EV-001/u);
});

test("status runs without starting an agent", async (context) => {
  const root = repository(context);
  const pi = fakePi();
  specDuckbill(pi);
  await pi.commands.get("duck:init").handler("safe-feature", {cwd: root});
  await pi.commands.get("duck:status").handler("safe-feature", {cwd: root});
  assert.equal(pi.messages.at(-1).user, undefined);
  assert.match(pi.messages.at(-1).value.content, /Specification: draft/u);
  assert.match(pi.messages.at(-1).value.content, /Next: \/duck:spec safe-feature/u);
});
