#!/usr/bin/env bun
/**
 * run-kata.ts — Fire one prompt x one kata x one ring, N times
 *
 * Usage: bun run runner/run-kata.ts --kata bowling-game --ring 1 --prompt baseline --runs 10
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";
import YAML from "yaml";
import Mustache from "mustache";
import { fireOllama } from "./adapters/ollama";
import { runFullstackKata } from "./run-fullstack";

const DOJO_ROOT = resolve(import.meta.dir, "..");

// --- Parse CLI args ---
function parseArgs(): { kata: string; ring: number; prompt: string; runs: number; model?: string } {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  return {
    kata: get("--kata") || "bowling-game",
    ring: parseInt(get("--ring") || "1"),
    prompt: get("--prompt") || "baseline",
    runs: parseInt(get("--runs") || "10"),
    model: get("--model"),
  };
}

// --- Load kata data for a specific ring ---
function loadKata(kataName: string, ring: number) {
  const kataDir = join(DOJO_ROOT, "katas", kataName);
  const kataYaml = YAML.parse(readFileSync(join(kataDir, "kata.yaml"), "utf-8"));
  const ringConfig = kataYaml.rings[ring];
  if (!ringConfig) {
    throw new Error(`Ring ${ring} not defined for kata ${kataName}`);
  }

  const description = readFileSync(join(kataDir, "description.md"), "utf-8");
  const provides = ringConfig.provides as string[];

  let architecture = "";
  if (provides.includes("architecture") && existsSync(join(kataDir, "architecture.md"))) {
    architecture = readFileSync(join(kataDir, "architecture.md"), "utf-8");
  }

  let tests = "";
  if (provides.includes("tests")) {
    const testsDir = join(kataDir, "tests");
    if (existsSync(testsDir)) {
      const testFiles = readdirSync(testsDir).filter((f) => f.endsWith(".test.ts"));
      tests = testFiles.map((f) => readFileSync(join(testsDir, f), "utf-8")).join("\n");
    }
  }

  return { kataYaml, ringConfig, description, architecture, tests, kataDir };
}

// --- Load and render prompt template ---
function renderPrompt(promptName: string, data: Record<string, string | boolean>) {
  const promptDir = join(DOJO_ROOT, "prompts", promptName);
  const template = readFileSync(join(promptDir, "implement.md"), "utf-8");
  return Mustache.render(template, data);
}

// --- Create isolated workspace for a run ---
function createWorkspace(kataName: string, ring: number, kataDir: string, provides: string[]): string {
  const ws = join(tmpdir(), `dojo-${kataName}-ring${ring}-${Date.now()}`);
  mkdirSync(ws, { recursive: true });

  // Copy test files if provided — preserve tests/ subdir so ../impl imports resolve
  if (provides.includes("tests") && existsSync(join(kataDir, "tests"))) {
    const testsDir = join(kataDir, "tests");
    const wsTestsDir = join(ws, "tests");
    mkdirSync(wsTestsDir, { recursive: true });
    readdirSync(testsDir).forEach((f) => {
      cpSync(join(testsDir, f), join(wsTestsDir, f));
    });
  }

  // Copy legacy code if provided (gilded rose)
  if (provides.includes("legacy_code") && existsSync(join(kataDir, "legacy"))) {
    const legacyDir = join(kataDir, "legacy");
    readdirSync(legacyDir).forEach((f) => {
      cpSync(join(legacyDir, f), join(ws, f));
    });
  }

  // Symlink node_modules from dojo root so vitest+typescript are available
  // without a per-workspace install. Cheaper than bun install per run.
  const dojoRoot = resolve(import.meta.dir, "..");
  try {
    require("fs").symlinkSync(
      join(dojoRoot, "node_modules"),
      join(ws, "node_modules"),
      "dir"
    );
  } catch {}

  // Write a minimal package.json for vitest
  writeFileSync(
    join(ws, "package.json"),
    JSON.stringify(
      {
        type: "module",
        devDependencies: { vitest: "^1.6.0", typescript: "^5.4.0" },
      },
      null,
      2
    )
  );

  return ws;
}

// --- Run tests in workspace ---
// Parses vitest summary lines specifically. Model-written console.log can emit
// strings like "23 passed" that would poison a loose /(\d+) passed/ regex.
// Vitest summary format:
//   Test Files  1 passed (1)
//   Test Files  1 failed | 4 passed (5)
//        Tests  7 passed (7)
//        Tests  5 failed | 13 passed (18)
function parseVitestSummary(out: string): { passing: number; failing: number; filesFailed: number } {
  let passing = 0, failing = 0, filesFailed = 0;
  const lines = out.split(/\r?\n/);
  for (const ln of lines) {
    const trimmed = ln.trim();
    const mFiles = /^Test Files\s+(?:(\d+)\s+failed\s*\|\s*)?(\d+)?\s*passed?\s*\((\d+)\)/i.exec(trimmed);
    if (mFiles) { if (mFiles[1]) filesFailed = parseInt(mFiles[1]); continue; }
    const mFilesFailOnly = /^Test Files\s+(\d+)\s+failed\s*\((\d+)\)/i.exec(trimmed);
    if (mFilesFailOnly) { filesFailed = parseInt(mFilesFailOnly[1]); continue; }
    const mTests = /^Tests\s+(?:(\d+)\s+failed\s*\|\s*)?(\d+)\s+passed\s*\(\d+\)/i.exec(trimmed);
    if (mTests) { if (mTests[1]) failing = parseInt(mTests[1]); passing = parseInt(mTests[2]); continue; }
    const mTestsFailOnly = /^Tests\s+(\d+)\s+failed\s*\(\d+\)/i.exec(trimmed);
    if (mTestsFailOnly) { failing = parseInt(mTestsFailOnly[1]); continue; }
  }
  return { passing, failing, filesFailed };
}

function runTests(workspace: string, testPath: string = ""): { passed: boolean; total: number; passing: number; output: string } {
  let output = "";
  const vitestArgs = testPath ? `run ${testPath}` : "run";
  try {
    output = execSync(`./node_modules/.bin/vitest ${vitestArgs} --reporter=verbose 2>&1`, {
      cwd: workspace,
      timeout: 60000,
      encoding: "utf-8",
    });
  } catch (e: any) {
    output = e.stdout || e.message || "";
  }
  const s = parseVitestSummary(output);
  const total = s.passing + s.failing;
  const passed = s.failing === 0 && s.filesFailed === 0 && s.passing > 0;
  return { passed, total, passing: s.passing, output };
}

// --- Main ---
async function main() {
  const { kata, ring, prompt, runs, model } = parseArgs();
  const dojoConfig = YAML.parse(readFileSync(join(DOJO_ROOT, "dojo.yaml"), "utf-8"));

  console.log(`\n=== Cloove Dojo ===`);
  console.log(`Kata: ${kata} | Ring: ${ring} | Prompt: ${prompt} | Runs: ${runs}`);
  console.log(`Model: ${model || dojoConfig.models.primary}\n`);

  const { kataYaml, ringConfig, description, architecture, tests, kataDir } = loadKata(kata, ring);

  // --- Fullstack routing ---
  // If kata type is "fullstack", delegate to the fullstack runner
  if (kataYaml.type === "fullstack") {
    console.log("  Detected fullstack kata — using fullstack pipeline\n");

    const resultsDir = join(DOJO_ROOT, "results", new Date().toISOString().split("T")[0], kata, prompt);
    mkdirSync(resultsDir, { recursive: true });

    for (let i = 1; i <= runs; i++) {
      console.log(`--- Fullstack Run ${i}/${runs} ---`);
      const workspace = join(tmpdir(), `dojo-${kata}-fullstack-${Date.now()}`);

      const fsResult = await runFullstackKata({
        kataDir,
        workspaceDir: workspace,
        dojoRoot: DOJO_ROOT,
        model,
        temperature: kataYaml?.harness?.temperature,
      });

      console.log(`  Scaffold: ${fsResult.phases.scaffold.success ? "✓" : "✗"}`);
      console.log(`  Dev:      ${fsResult.phases.dev.success ? "✓" : "✗"} ${fsResult.phases.dev.message}`);
      console.log(`  Comply:   ${fsResult.phases.compliance.success ? "✓" : "✗"} (score: ${fsResult.phases.compliance.score})`);
      console.log(`  SDET:     ${fsResult.phases.sdet.success ? "✓" : "✗"}`);
      console.log(`  E2E:      ${fsResult.phases.tests_e2e.success ? "✓" : "✗"}`);
      console.log(`  Unit:     ${fsResult.phases.tests_unit.success ? "✓" : "✗"}`);
      console.log(`  Overall:  ${fsResult.success ? "PASS ✓" : "FAIL ✗"} (${fsResult.duration}ms)`);

      writeFileSync(
        join(resultsDir, `run-${String(i).padStart(2, "0")}.json`),
        JSON.stringify(fsResult, null, 2)
      );
    }

    const totalMsg = `\n=== Fullstack Summary for ${kata} ===\nRuns: ${runs} | Results: ${resultsDir}`;
    console.log(totalMsg);
    return;
  }


  // Render prompt
  const renderedPrompt = renderPrompt(prompt, {
    kata_name: kataYaml.name,
    description,
    architecture,
    tests,
  });

  // Results directory
  const today = new Date().toISOString().split("T")[0];
  const resultsDir = join(DOJO_ROOT, "results", today, kata, prompt);
  mkdirSync(resultsDir, { recursive: true });

  const results: any[] = [];

  for (let i = 1; i <= runs; i++) {
    console.log(`--- Run ${i}/${runs} ---`);

    const workspace = createWorkspace(kata, ring, kataDir, ringConfig.provides);
    console.log(`  Workspace: ${workspace}`);

    // Fire Ollama — honor kata.yaml harness.temperature override if set
    const kataHarnessTemp = kataYaml?.harness?.temperature;
    const ollamaResult = await fireOllama(
      renderedPrompt,
      workspace,
      kataYaml.timeout_minutes || 15,
      model || dojoConfig.models.primary,
      kataHarnessTemp !== undefined ? { temperature: kataHarnessTemp } : undefined
    );

    console.log(`  Ollama exit: ${ollamaResult.exitCode} (${ollamaResult.elapsedSeconds.toFixed(1)}s${ollamaResult.timedOut ? " TIMEOUT" : ""})`);

    // Run tests
    const testResult = runTests(
      workspace,
      ringConfig.provides.includes("tests") ? "tests" : ""
    );
    console.log(`  Tests: ${testResult.passing}/${testResult.total} passing${testResult.passed ? " ✓" : " ✗"}`);

    // Parse completion status from model output
    const statusMatch = ollamaResult.stdout.match(/\*\*STATUS:\*\*\s*(DONE|DONE_WITH_CONCERNS|BLOCKED)/);
    const cyclesMatch = ollamaResult.stdout.match(/\*\*CYCLES:\*\*\s*(\d+)/);

    const result = {
      kata,
      ring,
      prompt,
      model: model || dojoConfig.models.primary,
      run_number: i,
      tests_pass: testResult.passed,
      tests_total: testResult.total,
      tests_passing: testResult.passing,
      cycles: cyclesMatch ? parseInt(cyclesMatch[1]) : -1,
      time_seconds: ollamaResult.elapsedSeconds,
      timed_out: ollamaResult.timedOut,
      exit_code: ollamaResult.exitCode,
      status: statusMatch ? statusMatch[1] : (ollamaResult.timedOut ? "TIMEOUT" : "UNKNOWN"),
      workspace,
      timestamp: new Date().toISOString(),
    };

    results.push(result);
    writeFileSync(
      join(resultsDir, `run-${String(i).padStart(2, "0")}.json`),
      JSON.stringify(result, null, 2)
    );
  }

  // Summary
  const passed = results.filter((r) => r.tests_pass).length;
  const avgTime = results.reduce((a, r) => a + r.time_seconds, 0) / results.length;

  console.log(`\n=== Summary ===`);
  console.log(`Pass rate: ${passed}/${runs} (${((passed / runs) * 100).toFixed(0)}%)`);
  console.log(`Avg time: ${avgTime.toFixed(1)}s`);
  console.log(`Results: ${resultsDir}`);
}

main().catch(console.error);
