---
type: seed
cloove: dev
topic: quote-non-identifier-keys
tags: [clean-code, syntax, javascript, object-literal, quoting]
applies_to: all-katas
---

# Seed — Quote object keys that contain non-identifier characters

In a JavaScript / TypeScript object literal, an unquoted key must be a
valid identifier — letters, digits, `_`, and `$` only, not starting
with a digit. Any other character means the key MUST be a string
literal.

Common keys that need quoting:

- Apostrophes: `"don't"`, `"o'clock"`, `"won't"`
- Hyphens: `"data-testid"`, `"red-black-tree"`, `"out-of-order"`
- Spaces: `"first name"`, `"last name"`
- Anything starting with a digit: `"42"`, `"1st"`
- Punctuation: `"hello!"`, `"a/b"`

## The trap

```ts
// SYNTAX ERROR — unterminated string literal at "don't"
expect(wordCount("don't stop")).toEqual({ don't: 1, stop: 1 });

// FIX — quote the key
expect(wordCount("don't stop")).toEqual({ "don't": 1, stop: 1 });
```

The parser sees `don` (identifier), then `'`, then it's mid-string until
the next `'`, and never finds it before the line ends.

## When you're writing tests

Tests for functions that return maps with non-identifier keys (word
counts of contractions, counts of CSV column names, lookups by
hyphenated id) are the most common place this trips. Always quote keys
unless the key is plainly a clean identifier.

## In TypeScript types too

The same rule applies in type literals — `Record<"don't", number>` is
fine, but `{ don't: number }` is a syntax error. Use string literals
in types just like in object expressions.

## Why this seed exists

A test file with one syntax error fails to load entirely — vitest
reports zero tests run, the runner records a SCAR with no diagnostic
detail, and the model's actual logic was never even checked. One
unquoted key with an apostrophe can flip a 100% kata to a 0%. Always
quote when the key isn't a clean identifier.
