# Tic-Tac-Toe Winner

Given a 3x3 tic-tac-toe board, return who has won — `"X"`, `"O"`, or
`null` if there is no winner yet.

## Behavior

The board is a 9-character string of `"X"`, `"O"`, or `"."` characters,
read row-by-row. There are 8 winning lines: 3 rows, 3 columns, 2
diagonals.

```
winner("XXX......")  → "X"  // top row
winner("...XXX...")  → "X"  // middle row
winner("X...X...X")  → "X"  // diagonal
winner("..X.X.X..")  → "X"  // anti-diagonal
winner("OOO......")  → "O"
winner(".........")  → null
winner("XOX.O.OXO")  → null  // no winner
winner("XXOOO.X..")  → "O"   // middle column
```

## Constraints

- Input is exactly 9 characters, each one of `"X"`, `"O"`, or `"."`.
- Throw on malformed input (wrong length, illegal characters).
- A board with both X and O winners is not legal in real tic-tac-toe,
  but if the input has both, return the first one you find — the test
  set does NOT include such cases, so you can implement either way.
- A full board with no winner returns `null`.
