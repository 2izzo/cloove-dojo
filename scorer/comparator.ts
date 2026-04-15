#!/usr/bin/env bun
/**
 * comparator.ts — Compare results across prompts for a given kata/ring/date
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import YAML from "yaml";
import { scoreMetric, computeTotal, type MetricDef } from "./metrics";

const DOJO_ROOT = resolve(import.meta.dir, "..");

function loadResults(date: string, kata: string): Record<string, any[]> {
  const baseDir = join(DOJO_ROOT, "results", date, kata);
  if (!existsSync(baseDir)) return {};

  const prompts: Record<string, any[]> = {};
  for (const promptDir of readdirSync(baseDir)) {
    const promptPath = join(baseDir, promptDir);
    const runs: any[] = [];
    for (const file of readdirSync(promptPath).filter((f) => f.endsWith(".json"))) {
      runs.push(JSON.parse(readFileSync(join(promptPath, file), "utf-8")));
    }
    if (runs.length > 0) prompts[promptDir] = runs;
  }
  return prompts;
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function variance(arr: number[]): number {
  const mean = avg(arr);
  return arr.length ? avg(arr.map((x) => (x - mean) ** 2)) : 0;
}

function main() {
  const date = process.argv[2] || new Date().toISOString().split("T")[0];
  const kata = process.argv[3];

  if (!kata) {
    console.error("Usage: bun run scorer/comparator.ts <date> <kata>");
    process.exit(1);
  }

  const kataYaml = YAML.parse(
    readFileSync(join(DOJO_ROOT, "katas", kata, "kata.yaml"), "utf-8")
  );
  const scoring = kataYaml.scoring as Record<string, MetricDef>;
  const prompts = loadResults(date, kata);

  if (Object.keys(prompts).length === 0) {
    console.log(`No results found for ${kata} on ${date}`);
    return;
  }

  // Header
  const promptNames = Object.keys(prompts);
  const colWidth = 14;
  const pad = (s: string) => s.padEnd(colWidth);

  console.log(`\n=== ${kata} — ${date} ===\n`);
  console.log(pad("Metric") + promptNames.map((p) => pad(p)).join(""));
  console.log("-".repeat(colWidth * (promptNames.length + 1)));

  // Pass rate
  const line = (label: string, fn: (runs: any[]) => string) => {
    let row = pad(label);
    for (const name of promptNames) {
      row += pad(fn(prompts[name]));
    }
    console.log(row);
  };

  line("Pass rate", (runs) => {
    const p = runs.filter((r) => r.tests_pass).length;
    return `${p}/${runs.length} (${((p / runs.length) * 100).toFixed(0)}%)`;
  });

  line("Avg cycles", (runs) => {
    const valid = runs.filter((r) => r.cycles >= 0).map((r) => r.cycles);
    return valid.length ? avg(valid).toFixed(1) : "n/a";
  });

  line("Avg time (s)", (runs) => avg(runs.map((r) => r.time_seconds)).toFixed(1));

  line("Avg score", (runs) => {
    const scores = runs.map((r) => {
      const s: Record<string, number> = {
        tests_pass: scoreMetric("binary", r.tests_pass),
        cycles: scoreMetric("inverse_linear", r.cycles, { baseline: kataYaml.max_cycles || 10 }),
        time: scoreMetric("inverse_linear", r.time_seconds, { baseline: (kataYaml.timeout_minutes || 15) * 60 }),
      };
      return computeTotal(s, scoring);
    });
    return avg(scores).toFixed(1);
  });

  line("Variance", (runs) => {
    const times = runs.map((r) => r.time_seconds);
    return variance(times).toFixed(1);
  });

  line("Timeouts", (runs) => `${runs.filter((r) => r.timed_out).length}`);

  console.log("");
}

main();
