import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8"));

test("Pi package explicitly installs prompts, skills, and bundled state runtime", () => {
    assert.deepEqual(manifest.pi, {
        prompts: ["./prompts"],
        skills: ["./skills"],
    });
    assert.ok(manifest.files.includes("prompts"));
    assert.ok(manifest.files.includes("skills"));
    assert.equal(existsSync(resolve("skills/duckbill-state/SKILL.md")), true);
    assert.equal(existsSync(resolve("skills/duckbill-state/scripts/state.mjs")), true);
    assert.equal(existsSync(resolve("scripts/state.mjs")), false);
});

test("state runtime requires the documented Node version without dependencies", () => {
    assert.equal(manifest.engines.node, ">=20");
    assert.equal(manifest.dependencies, undefined);
    assert.equal(manifest.devDependencies, undefined);
});
