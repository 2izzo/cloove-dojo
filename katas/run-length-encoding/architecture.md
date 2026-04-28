# Architecture

## Public API

```typescript
export function encode(s: string): string;
export function decode(s: string): string;
```

Two exported functions, `encode` and `decode`, mutually inverse on
well-formed input.

## Implementation guidance

**Encode** — single pass, track the current character and its count;
when the next character differs (or we've reached the end), emit
`<count><char>` and start a new run.

**Decode** — single pass, accumulate digit characters into a number,
then emit that many copies of the next character. Throw if the input
ends mid-run (digits without a following character) or starts with a
non-digit.
