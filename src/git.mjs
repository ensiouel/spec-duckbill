import {spawnSync} from "node:child_process";

function git(cwd, args) {
  const result = spawnSync("git", ["-C", cwd, ...args], {encoding: "utf8"});
  return result.status === 0 ? result.stdout.trim() : null;
}

export function gitRoot(cwd) {
  return git(cwd, ["rev-parse", "--show-toplevel"]);
}

export function gitInfo(root) {
  const status = git(root, ["status", "--short"]);
  if (status === null) return {dirty: null, changes: []};
  const changes = status.split("\n").filter(Boolean);
  return {dirty: changes.length > 0, changes};
}
