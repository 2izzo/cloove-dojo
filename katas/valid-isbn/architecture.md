# Architecture

## Public API

```typescript
export function isValidIsbn10(s: string): boolean;
```

Single exported function. Returns a strict boolean. Never throws.

## Implementation guidance

1. Strip hyphens.
2. If length != 10, return false.
3. Validate first 9 chars are digits, tenth is digit or 'X'.
4. Compute weighted sum: for each char at position i (1-indexed),
   `weight * value` where value is the digit (or 10 if 'X' at pos 10).
5. Return `sum % 11 === 0`.
