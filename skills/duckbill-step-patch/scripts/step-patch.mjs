#!/usr/bin/env node

import {randomBytes} from "node:crypto";
import {existsSync, lstatSync, mkdirSync, realpathSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, isAbsolute, join, relative, resolve, sep} from "node:path";
import {spawnSync} from "node:child_process";

function fail(message) {
    process.stderr.write(`step-patch: ${message}\n`);
    process.exit(1);
}

function parseArgs(argv) {
    const [command, ...rest] = argv;
    const options = {exclude: []};

    for (let index = 0; index < rest.length; index += 1) {
        const token = rest[index];
        if (!token.startsWith("--")) {
            fail(`unexpected argument: ${token}`);
        }

        const key = token.slice(2);
        const value = rest[index + 1];
        if (!value || value.startsWith("--")) {
            fail(`missing value for --${key}`);
        }
        index += 1;

        if (key === "exclude") {
            options.exclude.push(value);
        } else {
            options[key] = value;
        }
    }

    return {command, options};
}

function runGit(repoRoot, args, extraEnv = {}, allowFailure = false) {
    const result = spawnSync("git", ["-C", repoRoot, ...args], {
        env: {...process.env, ...extraEnv},
        encoding: null,
        maxBuffer: 128 * 1024 * 1024,
    });

    if (result.error) {
        fail(`cannot run git: ${result.error.message}`);
    }
    if (result.status !== 0 && !allowFailure) {
        const message = result.stderr?.toString("utf8").trim() || `git exited with ${result.status}`;
        fail(message);
    }
    return result;
}

function findRepoRoot(repoOption) {
    const requested = resolve(repoOption || process.cwd());
    const result = runGit(requested, ["rev-parse", "--show-toplevel"]);
    return realpathSync(result.stdout.toString("utf8").trim());
}

function createSnapshot(repoRoot) {
    const suffix = randomBytes(8).toString("hex");
    const indexPath = join(tmpdir(), `duckbill-index-${process.pid}-${suffix}`);
    const env = {GIT_INDEX_FILE: indexPath};

    try {
        const head = runGit(repoRoot, ["rev-parse", "--verify", "HEAD^{commit}"], {}, true);
        if (head.status === 0) {
            runGit(repoRoot, ["read-tree", "HEAD"], env);
        } else {
            runGit(repoRoot, ["read-tree", "--empty"], env);
        }
        runGit(repoRoot, ["add", "-A", "--", "."], env);
        const result = runGit(repoRoot, ["write-tree"], env);
        return result.stdout.toString("utf8").trim();
    } finally {
        rmSync(indexPath, {force: true});
        rmSync(`${indexPath}.lock`, {force: true});
    }
}

function validateTree(repoRoot, tree) {
    if (!/^[0-9a-fA-F]{40,64}$/.test(tree)) {
        fail(`invalid base tree: ${tree}`);
    }
    runGit(repoRoot, ["cat-file", "-e", `${tree}^{tree}`]);
}

function pathInsideRepo(repoRoot, targetPath) {
    const rel = relative(repoRoot, targetPath);
    return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function validateOutputPath(repoRoot, outputPath) {
    const realRepoRoot = realpathSync(repoRoot);
    if (!pathInsideRepo(realRepoRoot, outputPath)) {
        fail("output path must be inside the repository");
    }

    const relativeOutput = relative(realRepoRoot, outputPath);
    let currentPath = realRepoRoot;
    for (const part of relativeOutput.split(sep).slice(0, -1)) {
        currentPath = join(currentPath, part);
        if (!existsSync(currentPath)) {
            break;
        }
        const status = lstatSync(currentPath);
        if (status.isSymbolicLink()) {
            fail("output path must not traverse symbolic links");
        }
        if (!status.isDirectory()) {
            fail("output path parent is not a directory");
        }
        if (!pathInsideRepo(realRepoRoot, realpathSync(currentPath))) {
            fail("output path must resolve inside the repository");
        }
    }
}

function toGitPath(pathValue) {
    return pathValue.split(sep).join("/");
}

function buildPatch(repoRoot, baseTree, outputOption, extraExcludes) {
    validateTree(repoRoot, baseTree);
    const realRepoRoot = realpathSync(repoRoot);
    const outputPath = resolve(realRepoRoot, outputOption);
    validateOutputPath(realRepoRoot, outputPath);
    const currentTree = createSnapshot(repoRoot);
    const exclusions = [...extraExcludes];
    exclusions.push(toGitPath(relative(repoRoot, outputPath)));

    const pathspecs = [".", ...exclusions.map((pattern) => `:(exclude)${pattern}`)];
    const result = runGit(repoRoot, [
        "diff",
        "--binary",
        "--no-ext-diff",
        "--no-textconv",
        "--full-index",
        baseTree,
        currentTree,
        "--",
        ...pathspecs,
    ]);

    mkdirSync(dirname(outputPath), {recursive: true});
    const temporaryOutput = `${outputPath}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`;
    try {
        writeFileSync(temporaryOutput, result.stdout);
        renameSync(temporaryOutput, outputPath);
    } finally {
        rmSync(temporaryOutput, {force: true});
    }

    return {
        baseTree,
        currentTree,
        output: toGitPath(relative(repoRoot, outputPath)),
        bytes: result.stdout.length,
        empty: result.stdout.length === 0,
    };
}

const {command, options} = parseArgs(process.argv.slice(2));
const repoRoot = findRepoRoot(options.repo);

if (command === "snapshot") {
    const tree = createSnapshot(repoRoot);
    process.stdout.write(`${JSON.stringify({tree, repoRoot})}\n`);
} else if (command === "build") {
    if (!options.base) {
        fail("build requires --base <tree>");
    }
    if (!options.output) {
        fail("build requires --output <path>");
    }
    const result = buildPatch(repoRoot, options.base, options.output, options.exclude);
    process.stdout.write(`${JSON.stringify(result)}\n`);
} else {
    fail("usage: step-patch.mjs snapshot --repo <path> | build --repo <path> --base <tree> --output <path> [--exclude <pattern>]");
}
