#!/usr/bin/env node

import {lstatSync, mkdirSync, statSync, writeFileSync} from "node:fs";
import {relative, resolve, sep} from "node:path";

function fail(message) {
    process.stderr.write(`spec-init: ${message}\n`);
    process.exit(1);
}

function parseArgs(argv) {
    const options = {};

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (token !== "--repo" && token !== "--name") {
            fail(`unexpected argument: ${token}`);
        }

        const value = argv[index + 1];
        if (value === undefined) {
            fail(`missing value for ${token}`);
        }

        const key = token.slice(2);
        if (options[key] !== undefined) {
            fail(`duplicate option: ${token}`);
        }
        options[key] = value;
        index += 1;
    }

    return options;
}

function safeSlug(name) {
    return name
        .normalize("NFKC")
        .toLowerCase()
        .replace(/['’]/gu, "")
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/gu, "");
}

const options = parseArgs(process.argv.slice(2));
if (!options.repo) {
    fail("missing --repo <repository-root>");
}

const title = options.name?.trim();
if (!title) {
    fail("missing --name <specification name>");
}
if (/[\\/]/u.test(title)) {
    fail("specification name must not contain path separators");
}
if (/[\u0000-\u001f\u007f]/u.test(title)) {
    fail("specification name must not contain control characters");
}

const slug = safeSlug(title);
if (!slug) {
    fail("specification name must contain at least one letter or number");
}
if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu.test(slug)) {
    fail("specification name resolves to a reserved filename");
}

const filename = `${slug}.md`;
if (Buffer.byteLength(filename, "utf8") > 240) {
    fail("specification name is too long for a safe filename");
}

const repoRoot = resolve(options.repo);
try {
    if (!statSync(repoRoot).isDirectory()) {
        fail("repository root is not a directory");
    }
} catch (error) {
    if (error?.code === "ENOENT") {
        fail("repository root does not exist");
    }
    throw error;
}

const specsDir = resolve(repoRoot, "specs");
const targetPath = resolve(specsDir, filename);
const relativePath = relative(repoRoot, targetPath);
if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`)
) {
    fail("target path must be inside the repository");
}

try {
    const specsStat = lstatSync(specsDir);
    if (specsStat.isSymbolicLink()) {
        fail("specs directory must not be a symbolic link");
    }
    if (!specsStat.isDirectory()) {
        fail("specs path is not a directory");
    }
} catch (error) {
    if (error?.code === "ENOENT") {
        mkdirSync(specsDir);
    } else {
        throw error;
    }
}

const content = `---
status: draft
---

# ${title}

## Description

> [WRITE HERE] Describe what should be built, why it is needed, important constraints, and which project areas should
> be studied.
`;

try {
    writeFileSync(targetPath, content, {encoding: "utf8", flag: "wx"});
} catch (error) {
    if (error?.code === "EEXIST") {
        fail(`target already exists: ${relativePath}`);
    }
    throw error;
}

process.stdout.write(
    `${JSON.stringify({
        path: relativePath.split(sep).join("/"),
        title,
        slug,
    })}\n`,
);
