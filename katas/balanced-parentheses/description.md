# Balanced Parentheses

Implement a function that determines whether a string of brackets is
balanced. The function handles three pairs: `()`, `[]`, `{}`.

## Behavior

A string is balanced when:

1. Every opening bracket `(`, `[`, `{` has a matching closing bracket of
   the same type.
2. Brackets are closed in the correct order — the most recently opened
   bracket is the one that must close next (LIFO).
3. The empty string is balanced.

```
isBalanced("")            → true
isBalanced("()")          → true
isBalanced("()[]{}")      → true
isBalanced("({[]})")      → true
isBalanced("(")           → false   (unclosed)
isBalanced(")")           → false   (no opener)
isBalanced("(]")          → false   (mismatched pair)
isBalanced("({)}")        → false   (interleaved, not nested)
```

## Constraints

- Input is a string of arbitrary length, including the empty string.
- Only the six bracket characters affect balance; **all other characters
  are ignored** (so `"a(b)c"` is balanced).
- Return value is a strict boolean — `true` or `false`, never null/throw.
