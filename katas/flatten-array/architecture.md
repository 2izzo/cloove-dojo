# Architecture

## Public API

```typescript
export function flatten(input: unknown[]): unknown[];
```

Single exported function. Returns a new array; does not mutate the input.

## Implementation guidance

Three valid approaches:

1. **Recursive** — for each element, if it's an array, recurse and
   concatenate; otherwise push directly. Simple and readable.
2. **Iterative with a stack** — pop elements from a stack; if an
   element is an array, push its members back; otherwise prepend to
   result. Avoids deep recursion stacks.
3. **Built-in** — `input.flat(Infinity)`. Concise. Works for any depth.

`Array.isArray(x)` is the canonical check for "is this an array."
