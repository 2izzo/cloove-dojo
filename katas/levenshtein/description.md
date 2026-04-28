# Levenshtein Distance

Implement a function that returns the Levenshtein edit distance between
two strings — the minimum number of single-character insertions,
deletions, or substitutions needed to transform one into the other.

## Behavior

```
distance("", "")        → 0
distance("a", "")       → 1
distance("", "a")       → 1
distance("kitten", "sitting") → 3
distance("flaw", "lawn")      → 2
distance("abc", "abc")        → 0
distance("abc", "yabd")       → 2
```

## Constraints

- Both inputs are arbitrary-length strings, including the empty string.
- Result is a non-negative integer.
- Performance: must handle strings up to length 100 quickly. A naive
  recursive implementation will be too slow; use dynamic programming.
- Never throws.
