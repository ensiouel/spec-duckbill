import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

const script = resolve("skills/duckbill-spec-author/scripts/init-spec.mjs");

function temporaryDirectory() {
    return mkdtempSync(join(tmpdir(), "duckbill-init-test-"));
}

function run(repo, name) {
    return spawnSync(process.execPath, [script, "--repo", repo, "--name", name], {encoding: "utf8"});
}

test("creates a new specification", (context) => {
    const repo = temporaryDirectory();
    context.after(() => rmSync(repo, {recursive: true, force: true}));

    const result = run(repo, "Password Authentication");

    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
        path: "specs/password-authentication.md",
        title: "Password Authentication",
        slug: "password-authentication",
    });
    assert.match(readFileSync(join(repo, "specs/password-authentication.md"), "utf8"), /# Password Authentication/);
});

test("does not overwrite an existing specification", (context) => {
    const repo = temporaryDirectory();
    context.after(() => rmSync(repo, {recursive: true, force: true}));
    assert.equal(run(repo, "Existing Spec").status, 0);

    const result = run(repo, "Existing Spec");

    assert.equal(result.status, 1);
    assert.match(result.stderr, /target already exists/);
});

test("normalizes Unicode names and rejects unsafe names", (context) => {
    const repo = temporaryDirectory();
    context.after(() => rmSync(repo, {recursive: true, force: true}));

    const unicode = run(repo, "Тест Café");
    assert.equal(unicode.status, 0, unicode.stderr);
    assert.equal(JSON.parse(unicode.stdout).path, "specs/тест-café.md");

    for (const name of ["../escape", "CON", "bad\nname"]) {
        const unsafe = run(repo, name);
        assert.equal(unsafe.status, 1, `accepted unsafe name: ${JSON.stringify(name)}`);
    }
});
