# Architecture

## Public API

```typescript
export function fib(n: number): number;
```

Single exported function. Throws on negative `n`.

## Implementation guidance

Three approaches, in order of cost:

1. **Naive recursion** — `fib(n-1) + fib(n-2)`. O(2^n). Will time out
   for `n > 35`. Don't ship this.
2. **Iterative** — single loop, two running totals. O(n) time, O(1) space.
3. **Memoized recursion** — recursive with a cache. O(n) time, O(n) space.

The iterative form is the cleanest for this problem; memoization is the
right vocabulary for problems with overlapping recursive subproblems
beyond the 1D Fibonacci shape.
