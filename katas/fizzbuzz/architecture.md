# Architecture

## Public API

```typescript
export function fizzbuzz(n: number): string[];
```

Single exported function. Throws on negative `n`.

## Implementation guidance

For each integer `i` from 1 to `n`, decide which of four cases to emit.
Either nest the divisibility checks (most-specific-first: 15, then 3, then
5) or build the entry by concatenation of two flags. Either is fine.
