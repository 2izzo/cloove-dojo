# Architecture

## Public API

```typescript
export function isBalanced(s: string): boolean;
```

Single exported function. Returns `true` if the input string is bracket-
balanced, `false` otherwise.

## Implementation guidance

The canonical solution uses a stack:

1. Iterate over each character of the input.
2. If it's an opening bracket (`(`, `[`, `{`), push the matching closing
   bracket onto the stack.
3. If it's a closing bracket (`)`, `]`, `}`), check that the stack's top
   element equals the current character; if not, return `false`.
4. After iterating, return `true` if the stack is empty, else `false`.

Non-bracket characters can be skipped without affecting the algorithm.
