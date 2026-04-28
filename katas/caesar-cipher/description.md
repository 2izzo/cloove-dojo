# Caesar Cipher

Implement a function that shifts each letter in the input by a given
number of positions in the alphabet, wrapping around past Z. Non-letter
characters pass through unchanged. Letter case is preserved.

## Behavior

```
encode("abc", 1)        → "bcd"
encode("xyz", 3)        → "abc"             // wrap-around
encode("Hello, World!", 13) → "Uryyb, Jbeyq!" // non-letters preserved
encode("hello", 0)      → "hello"            // identity at shift 0
encode("hello", 26)     → "hello"            // identity at full shift
encode("hello", 27)     → "ifmmp"            // shift normalizes to 1
encode("hello", -1)     → "gdkkn"            // negative shift moves backward
encode("AbC", 1)        → "BcD"              // case preserved per char
```

## Constraints

- Input string is arbitrary text, may include digits, punctuation,
  whitespace, and non-ASCII characters. Only `[a-zA-Z]` participate in
  the cipher.
- `shift` is an integer (positive, negative, or zero). Normalize modulo
  26 before applying.
- The function does not throw on any input (including empty string —
  `encode("", 5)` is `""`).
