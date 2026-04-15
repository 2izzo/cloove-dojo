/**
 * Metric types and scoring functions for the dojo
 */

export type MetricType = "binary" | "coverage" | "lint_score" | "inverse_linear" | "structural";

export interface MetricDef {
  weight: number;
  type: MetricType;
}

export interface RawMetrics {
  tests_pass: boolean;
  tests_total: number;
  tests_passing: number;
  cycles: number;
  time_seconds: number;
  lint_errors?: number;
}

/**
 * Score a metric from 0-100 based on its type
 */
export function scoreMetric(type: MetricType, value: number | boolean, context?: Record<string, number>): number {
  switch (type) {
    case "binary":
      return value ? 100 : 0;

    case "coverage":
      // value is a percentage 0-100
      return Math.min(100, Math.max(0, value as number));

    case "lint_score":
      // 100 minus deductions (each error = -5, each warning = -2)
      return Math.max(0, 100 - (value as number));

    case "inverse_linear": {
      // Lower is better, normalized against a baseline
      const baseline = context?.baseline || 120; // default 120s or 10 cycles
      const v = value as number;
      if (v <= 0) return 100;
      return Math.max(0, Math.round(100 * (1 - v / baseline)));
    }

    case "structural":
      // AST similarity percentage — passed through as-is for now
      return Math.min(100, Math.max(0, value as number));

    default:
      return 0;
  }
}

/**
 * Compute weighted total score from individual metric scores
 */
export function computeTotal(scores: Record<string, number>, weights: Record<string, MetricDef>): number {
  let total = 0;
  let totalWeight = 0;

  for (const [key, def] of Object.entries(weights)) {
    if (scores[key] !== undefined) {
      total += scores[key] * (def.weight / 100);
      totalWeight += def.weight;
    }
  }

  // Normalize if weights don't sum to 100
  if (totalWeight > 0 && totalWeight !== 100) {
    total = total * (100 / totalWeight);
  }

  return Math.round(total * 10) / 10;
}
