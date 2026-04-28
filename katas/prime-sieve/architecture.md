# Architecture

## Public API

```typescript
export function primesUpTo(n: number): number[];
```

Single exported function. Accepts a non-negative integer `n` and returns
an ascending array of primes `≤ n`. Throws on negative input.

## Implementation guidance

The Sieve of Eratosthenes is the canonical solution:

1. Build a boolean array `isComposite` of length `n+1`, initialized to false.
2. For each integer `i` from 2 to √n, if `isComposite[i]` is false, mark
   every multiple of `i` (starting from `i*i`) as composite.
3. Collect all indices `i ≥ 2` where `isComposite[i]` is false.

Trial division also works but is slower for large `n`.
