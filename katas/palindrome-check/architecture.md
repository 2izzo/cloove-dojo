# Architecture

## Public API

```typescript
export function isPalindrome(s: string): boolean;
```

Single exported function. Returns a strict boolean.

## Implementation guidance

Two solutions:

1. **Filter then reverse-compare** — strip non-alphanumeric, lowercase,
   compare to its reverse. Concise and clear.
2. **Two-pointer scan** — pointers from both ends, advancing each past
   non-alphanumeric, comparing case-folded characters. O(n) without
   intermediate string allocation. Better vocabulary; same correctness.

Either is correct.
