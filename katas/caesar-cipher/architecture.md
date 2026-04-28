# Architecture

## Public API

```typescript
export function encode(text: string, shift: number): string;
```

Single exported function. Returns the shifted string.

## Implementation guidance

The canonical solution uses character-code arithmetic:

1. For each character, check whether it falls in `'a'..'z'` or `'A'..'Z'`.
2. If lowercase, compute `((charCode - 'a' + shift) mod 26 + 26) mod 26 + 'a'`.
3. If uppercase, same with `'A'` as the base.
4. Otherwise, pass the character through unchanged.

The double-modulo handles negative shifts cleanly: in JavaScript,
`(-1) % 26 === -1`, so wrapping back into the valid range needs the
extra `+ 26) % 26` step.
