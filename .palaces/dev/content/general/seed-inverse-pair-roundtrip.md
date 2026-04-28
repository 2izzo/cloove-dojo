---
type: seed
cloove: dev
topic: inverse-pair-roundtrip
tags: [clean-code, invariant, inverse, encode-decode, parse-print]
applies_to: all-katas
---

# Seed — When you have an inverse pair, the roundtrip is identity

Whenever a problem asks you to implement two functions that should be
inverses of each other — `encode/decode`, `parse/print`,
`serialize/deserialize`, `compress/decompress`, `pack/unpack` — there
is a hard correctness invariant: for every well-formed input `x`,

```
decode(encode(x)) === x
```

This is the **roundtrip invariant**. It is not optional. It is not a
nice-to-have. It is the property that defines what "inverse" means.

## The discipline

Before writing either function, sketch the data model both share:

1. What does an encoded value look like? Define the format precisely.
2. What characters/structures are reserved? What's escaped?
3. For each input shape your encoder might produce, can your decoder
   parse it unambiguously? If two distinct inputs encode to the same
   output, you've broken the invariant — your encoder is lossy.

Then write both functions. Then **trace at least one non-trivial input
through both directions in your head** before declaring the impl
complete:

```
x = "Hello, World!"
encode(x) = "1H1e2l1o1,1 1W1o1r1l1d1!"
decode(encode(x)) = ?      // walk every character; do you get x back?
```

If you can't walk through a full roundtrip mentally, your impl probably
has a bug.

## Common roundtrip bugs

- **Lossy encoder**: drops information needed to reverse (e.g., loses
  type, throws away whitespace, normalizes case).
- **Greedy decoder**: parses the wrong number of characters as a unit
  (e.g., treats `12A` as `12 As` correctly but `1AA` as `11 As`
  incorrectly).
- **Boundary leak**: encoder produces output the decoder rejects (or
  vice versa) at exactly one input — the empty string, single-character,
  multi-byte unicode.
- **Non-ASCII or special-character handling**: characters that are
  ambiguous with the encoding's structural marks (digits in RLE,
  delimiters in CSV, quotes in JSON-ish) need explicit handling.

## Why this seed exists

Algorithmically-correct encode and decode functions can both pass their
individual unit tests yet fail the roundtrip on specific inputs because
the decoder's parsing assumption diverges from the encoder's emission
shape. The roundtrip test catches it; treat it as a first-class
correctness check, not a bonus.
