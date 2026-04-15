#!/usr/bin/env bun
/**
 * score-run.ts — Score a single run result
 */

import { readFileSync } from "fs";
import { resolve, join } from "path";
import YAML from "yaml";
import { scoreMetric, computeTotal, type MetricDef } from "./metrics";

const DOJO_ROOT = resolve(import.meta.dir, "..");

function main() {
  const resultPath = process.argv[2];
  if (!resultPath) {
    console.error("Usage: bun run scorer/score-run.ts <result-json-path>");
    process.exit(1);
  }

  const result = JSON.parse(readFileSync(resultPath, "utf-8"));
  const kataYaml = YAML.parse(
    readFileSync(join(DOJO_ROOT, "katas", result.kata, "kata.yaml"), "utf-8")
  );

  const scoring = kataYaml.scoring as Record<string, MetricDef>;

  const scores: Record<string, number> = {
    tests_pass: scoreMetric("binary", result.tests_pass),
    test_quality: scoreMetric("coverage", result.tests_total > 0 ? (result.tests_passing / result.tests_total) * 100 : 0),
    code_quality: scoreMetric("lint_score", result.lint_errors || 0),
    cycles: scoreMetric("inverse_linear", result.cycles, { baseline: kataYaml.max_cycles || 10 }),
    time: scoreMetric("inverse_linear", result.time_seconds, { baseline: (kataYaml.timeout_minutes || 15) * 60 }),
  };

  const total = computeTotal(scores, scoring);

  console.log(`\n=== Score: ${result.kata} / ${result.prompt} / run-${result.run_number} ===`);
  for (const [key, score] of Object.entries(scores)) {
    const weight = scoring[key]?.weight || 0;
    console.log(`  ${key}: ${score}/100 (weight: ${weight}%)`);
  }
  console.log(`  TOTAL: ${total}/100`);
  console.log(`  STATUS: ${result.status}`);
}

main();
