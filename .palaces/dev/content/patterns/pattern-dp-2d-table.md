---
type: pattern
topic: dp-2d-table
tags: [dynamic-programming, dp, 2d-table, memoization]
shape: algorithm
applies_to: all-katas
---

# Pattern — Dynamic programming with a 2D table

Many problems on pairs of sequences (or pairs of (i, j) indices) have a
recurrence that's exponential if computed top-down recursively, but
linear in the table size when filled bottom-up. The 2D-table shape is
the canonical answer.

## The shape

For a problem `f(i, j)` defined on prefixes of two inputs `a` and `b`:

```ts
function compute(a: T[], b: U[]): number {
  const m = a.length;
  const n = b.length;

  // Allocate a (m+1) x (n+1) table. dp[i][j] is the answer for
  // a[0..i-1] vs b[0..j-1]. Row i=0 and column j=0 are base cases.
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  // Base cases — fill row 0 and column 0 according to the problem.
  for (let i = 0; i <= m; i++) dp[i][0] = i;        // problem-specific
  for (let j = 0; j <= n; j++) dp[0][j] = j;        // problem-specific

  // Fill the rest. The recurrence reads from dp[i-1][j-1], dp[i-1][j],
  // dp[i][j-1] depending on the problem.
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];                // match: free move
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],                             // option A
          dp[i][j - 1],                             // option B
          dp[i - 1][j - 1],                         // option C
        );
      }
    }
  }

  return dp[m][n];
}
```

## When this pattern fits

- Edit distance / Levenshtein
- Longest common subsequence / longest common substring
- Coin change (minimum coins for an amount)
- Counting paths through a grid
- Sequence alignment

The signal: the answer for inputs of size `(i, j)` can be computed
from the answers for slightly smaller `(i', j')` in O(1).

## Space optimization

When the recurrence only reads `dp[i-1][...]` and `dp[i][j-1]`, you
can roll two 1D arrays (current row + previous row) for O(min(m, n))
space. Optimize last; correctness first.

## Why this pattern

Recursing top-down without memoization is exponential. Memoizing fixes
the redundancy but recursion depth can blow the stack on long inputs.
Bottom-up table filling has predictable performance, no stack worries,
and is easy to inspect by printing the table.
