import assert from "node:assert/strict";
import {readFileSync, readdirSync, statSync} from "node:fs";
import {dirname, join, relative, resolve, sep} from "node:path";
import test from "node:test";

const skillsRoot = resolve("skills");

function filesBelow(root) {
    const result = [];
    for (const entry of readdirSync(root)) {
        const path = join(root, entry);
        if (statSync(path).isDirectory()) result.push(...filesBelow(path));
        else result.push(path);
    }
    return result;
}

test("skill packages do not name another installed skill", () => {
    const installed = new Set(readdirSync(skillsRoot).filter((entry) => statSync(join(skillsRoot, entry)).isDirectory()));
    for (const entry of installed) {
        const skillPath = join(skillsRoot, entry);
        for (const path of filesBelow(skillPath).filter((file) => /\.(?:md|mjs|yaml)$/u.test(file))) {
            const source = readFileSync(path, "utf8");
            const referenced = new Set((source.match(/duckbill-[a-z0-9-]+/gu) ?? []).filter((name) => installed.has(name)));
            for (const name of referenced) {
                assert.equal(name, entry, `${relative(skillsRoot, path)} references another installed skill: ${name}`);
            }
        }
    }
});

test("skill scripts import only Node built-ins or files inside their own skill", () => {
    for (const entry of readdirSync(skillsRoot)) {
        const skillRoot = join(skillsRoot, entry);
        if (!statSync(skillRoot).isDirectory()) continue;
        for (const path of filesBelow(skillRoot).filter((file) => file.endsWith(".mjs"))) {
            const source = readFileSync(path, "utf8");
            for (const match of source.matchAll(/from\s+["']([^"']+)["']/gu)) {
                const specifier = match[1];
                if (!specifier.startsWith(".")) continue;
                const imported = resolve(dirname(path), specifier);
                const rel = relative(skillRoot, imported);
                assert.ok(rel !== ".." && !rel.startsWith(`..${sep}`), `${relative(skillsRoot, path)} imports outside its skill: ${specifier}`);
            }
        }
    }
});
