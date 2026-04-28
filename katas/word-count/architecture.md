# Architecture

## Public API

```typescript
export function wordCount(text: string): Record<string, number>;
```

Single exported function. Returns a plain object mapping lowercase word
to count.

## Implementation guidance

A regex-based tokenizer is the cleanest approach:

```typescript
const tokens = text.toLowerCase().match(/[a-z]+(?:'[a-z]+)*/g) ?? [];
```

This pattern matches a run of letters, optionally followed by
`'<letters>` repeated — capturing contractions like `"don't"` and
`"o'clock"` while leaving leading/trailing apostrophes outside the
match.

Then accumulate counts in a `Record<string, number>` (or `Map`,
converting at the end).
