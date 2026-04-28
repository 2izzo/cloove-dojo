# Architecture

## Public API

```typescript
export function winner(board: string): "X" | "O" | null;
```

Single exported function. Throws on malformed input.

## Implementation guidance

The 8 winning lines as index triples:

```
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],   // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],   // cols
  [0, 4, 8], [2, 4, 6],              // diagonals
];
```

For each line, check if all three cells are the same non-`.` character.
If yes, return that character. If no line wins, return `null`.

Validate the input first: length 9, every character in `"XO."`.
