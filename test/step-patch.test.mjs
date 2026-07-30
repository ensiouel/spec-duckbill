import assert from "node:assert/strict";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

const script = resolve("skills/duckbill-step-patch/scripts/step-patch.mjs");

function command(commandName, args, options = {}) {
    return spawnSync(commandName, args, {encoding: "utf8", ...options});
}

function git(repo, ...args) {
    const result = command("git", ["-C", repo, ...args]);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
}

function createRepo({commit = true} = {}) {
    const repo = mkdtempSync(join(tmpdir(), "duckbill-patch-test-"));
    git(repo, "init", "--quiet");
    git(repo, "config", "user.name", "Duckbill Test");
    git(repo, "config", "user.email", "duckbill@example.invalid");
    if (commit) {
        write(repo, "tracked.txt", "before\n");
        git(repo, "add", "tracked.txt");
        git(repo, "commit", "--quiet", "-m", "initial");
    }
    return repo;
}

function write(repo, path, content) {
    const target = join(repo, path);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, content);
}

function stepPatch(repo, ...args) {
    return command(process.execPath, [script, ...args, "--repo", repo]);
}

function snapshot(repo) {
    const result = stepPatch(repo, "snapshot");
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout).tree;
}

function build(repo, base, output = "specs/plans/demo/steps/change.patch", excludes = []) {
    const args = ["build", "--base", base, "--output", output];
    for (const exclude of excludes) args.push("--exclude", exclude);
    return stepPatch(repo, ...args);
}

test("captures a snapshot in a repository without commits", (context) => {
    const repo = createRepo({commit: false});
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    write(repo, "new.txt", "content\n");

    const tree = snapshot(repo);

    assert.match(tree, /^[0-9a-f]{40,64}$/);
    assert.equal(git(repo, "ls-tree", "--name-only", tree), "new.txt");
});

test("patch includes changed and new files", (context) => {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    const base = snapshot(repo);
    write(repo, "tracked.txt", "after\n");
    write(repo, "new.txt", "new\n");

    const result = build(repo, base);

    assert.equal(result.status, 0, result.stderr);
    const patch = readFileSync(join(repo, "specs/plans/demo/steps/change.patch"), "utf8");
    assert.match(patch, /diff --git a\/tracked\.txt b\/tracked\.txt/);
    assert.match(patch, /diff --git a\/new\.txt b\/new\.txt/);
});

test("baseline preserves unrelated uncommitted user changes", (context) => {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    write(repo, "user-notes.txt", "keep me\n");
    const base = snapshot(repo);
    write(repo, "step.txt", "step change\n");

    const result = build(repo, base);

    assert.equal(result.status, 0, result.stderr);
    const patch = readFileSync(join(repo, "specs/plans/demo/steps/change.patch"), "utf8");
    assert.match(patch, /step\.txt/);
    assert.doesNotMatch(patch, /user-notes\.txt/);
    assert.equal(readFileSync(join(repo, "user-notes.txt"), "utf8"), "keep me\n");
});

test("patch represents binary changes", (context) => {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    write(repo, "image.bin", Buffer.from([0, 1, 2, 3]));
    git(repo, "add", "image.bin");
    git(repo, "commit", "--quiet", "-m", "add binary");
    const base = snapshot(repo);
    write(repo, "image.bin", Buffer.from([0, 9, 8, 7, 6]));

    const result = build(repo, base);

    assert.equal(result.status, 0, result.stderr);
    const patch = readFileSync(join(repo, "specs/plans/demo/steps/change.patch"), "utf8");
    assert.match(patch, /GIT binary patch|Binary files/);
});

test("rebuild replaces the same patch deterministically", (context) => {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    const base = snapshot(repo);
    write(repo, "tracked.txt", "after\n");

    assert.equal(build(repo, base).status, 0);
    const first = readFileSync(join(repo, "specs/plans/demo/steps/change.patch"));
    assert.equal(build(repo, base).status, 0);
    const second = readFileSync(join(repo, "specs/plans/demo/steps/change.patch"));

    assert.deepEqual(second, first);
});

test("does not modify the real Git index", (context) => {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    write(repo, "staged.txt", "staged\n");
    git(repo, "add", "staged.txt");
    const before = git(repo, "diff", "--cached", "--binary");

    const base = snapshot(repo);
    write(repo, "tracked.txt", "after\n");
    assert.equal(build(repo, base).status, 0);

    assert.equal(git(repo, "diff", "--cached", "--binary"), before);
});

test("excludes only explicit Duckbill artifacts", (context) => {
    const repo = createRepo();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    const base = snapshot(repo);
    write(repo, "specs/demo.md", "duckbill spec\n");
    write(repo, "specs/project-data.txt", "project data\n");
    write(repo, "specs/plans/demo/plan.md", "plan state\n");

    const result = build(repo, base, undefined, ["specs/demo.md", "specs/plans/demo/plan.md", "specs/plans/demo/steps/*.patch"]);

    assert.equal(result.status, 0, result.stderr);
    const patch = readFileSync(join(repo, "specs/plans/demo/steps/change.patch"), "utf8");
    assert.match(patch, /specs\/project-data\.txt/);
    assert.doesNotMatch(patch, /specs\/demo\.md/);
    assert.doesNotMatch(patch, /specs\/plans\/demo\/plan\.md/);
});

test("rejects an output path through a symbolic-link parent", {skip: process.platform === "win32"}, (context) => {
    const repo = createRepo();
    const outside = mkdtempSync(join(tmpdir(), "duckbill-outside-test-"));
    context.after(() => {
        rmSync(repo, {recursive: true, force: true});
        rmSync(outside, {recursive: true, force: true});
    });
    mkdirSync(join(repo, "specs"));
    symlinkSync(outside, join(repo, "specs", "linked"), "dir");
    const base = snapshot(repo);

    const result = build(repo, base, "specs/linked/change.patch");

    assert.equal(result.status, 1);
    assert.match(result.stderr, /must not traverse symbolic links/);
});
