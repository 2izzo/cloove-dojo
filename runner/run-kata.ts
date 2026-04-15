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
import { fireCline } from "./adapters/cline";

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

  // Copy test files if provided
  if (provides.includes("tests") && existsSync(join(kataDir, "tests"))) {
    const testsDir = join(kataDir, "tests");
    readdirSync(testsDir).forEach((f) => {
      cpSync(join(testsDir, f), join(ws, f));
    });
  }

  // Copy legacy code if provided (gilded rose)
  if (provides.includes("legacy_code") && existsSync(join(kataDir, "legacy"))) {
    const legacyDir = join(kataDir, "legacy");
    readdirSync(legacyDir).forEach((f) => {
      cpSync(join(legacyDir, f), join(ws, f));
    });
  }

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
function runTests(workspace: string): { passed: boolean; total: number; passing: number; output: string } {
  try {
    const output = execSync("bunx vitest run --reporter=verbose 2>&1", {
      cwd: workspace,
      timeout: 60000,
      encoding: "utf-8",
    });
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const passing = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    return { passed: failed === 0 && passing > 0, total: passing + failed, passing, output };
  } catch (e: any) {
    const output = e.stdout || e.message || "";
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const passing = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    return { passed: false, total: passing + failed, passing, output };
  }
}

// --- Main ---
async function main() {
  const { kata, ring, prompt, runs, model } = parseArgs();
  const dojoConfig = YAML.parse(readFileSync(join(DOJO_ROOT, "dojo.yaml"), "utf-8"));

  console.log(`\n=== Cloove Dojo ===`);
  console.log(`Kata: ${kata} | Ring: ${ring} | Prompt: ${prompt} | Runs: ${runs}`);
  console.log(`Model: ${model || dojoConfig.models.primary}\n`);

  const { kataYaml, ringConfig, description, architecture, tests, kataDir } = loadKata(kata, ring);

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

    // Fire Cline
    const clineResult = await fireCline(
      renderedPrompt,
      workspace,
      kataYaml.timeout_minutes || 15,
      model || dojoConfig.models.primary
    );

    console.log(`  Cline exit: ${clineResult.exitCode} (${clineResult.elapsedSeconds.toFixed(1)}s${clineResult.timedOut ? " TIMEOUT" : ""})`);

    // Run tests
    const testResult = runTests(workspace);
    console.log(`  Tests: ${testResult.passing}/${testResult.total} passing${testResult.passed ? " ✓" : " ✗"}`);

    // Parse completion status from Cline output
    const statusMatch = clineResult.stdout.match(/\*\*STATUS:\*\*\s*(DONE|DONE_WITH_CONCERNS|BLOCKED)/);
    const cyclesMatch = clineResult.stdout.match(/\*\*CYCLES:\*\*\s*(\d+)/);

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
      time_seconds: clineResult.elapsedSeconds,
      timed_out: clineResult.timedOut,
      exit_code: clineResult.exitCode,
      status: statusMatch ? statusMatch[1] : (clineResult.timedOut ? "TIMEOUT" : "UNKNOWN"),
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
