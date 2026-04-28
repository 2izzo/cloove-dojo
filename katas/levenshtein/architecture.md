# Architecture

## Public API

```typescript
export function distance(a: string, b: string): number;
```

Single exported function.

## Implementation guidance

Classic 2D dynamic programming. Let `dp[i][j]` be the edit distance
between `a.slice(0, i)` and `b.slice(0, j)`:

- `dp[0][j] = j`  (insert j chars)
- `dp[i][0] = i`  (delete i chars)
- `dp[i][j] = dp[i-1][j-1]` if `a[i-1] === b[i-1]`
- otherwise `dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])`

You can use a 2D array `(a.length+1) × (b.length+1)`, or roll two 1D
arrays for O(min(|a|,|b|)) space.
