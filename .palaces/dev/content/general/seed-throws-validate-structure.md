---
type: seed
cloove: dev
topic: throws-validate-structure
tags: [validation, throws, regex, ring1, contract-reading]
applies_to: any-kata-with-throws-tests
---

# Seed — `throws on invalid input` means structural validation that rejects empty too

When a test does:

```ts
expect(() => fromRoman("IIII")).toThrow();
expect(() => fromRoman("VV")).toThrow();
expect(() => fromRoman("")).toThrow();        // ← easy to miss
expect(() => fromRoman("MCMXCIXM")).toThrow();
```

The implementation must reject inputs that are *well-formed strings* but
violate the **domain grammar**, AND it must reject the empty string.
Type-checking (`if (typeof n !== 'string') throw`) is not enough — `""`
and `"IIII"` are both perfectly good strings.

## The empty-string trap

Many natural regexes accept empty input by accident. For roman numerals:

```ts
// WRONG — matches "" because every group can be empty
const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
ROMAN_RE.test("");  // true  ← bug
```

Fix it with a non-empty check or a quantifier that forbids empty:

```ts
export function fromRoman(s: string): number {
  if (!s) throw new Error("empty roman numeral");
  const re = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
  if (!re.test(s)) throw new Error(`invalid roman numeral: ${s}`);
  // ... actual conversion
}
```

Always test your validation against `""` mentally before you finalize. If
the regex matches empty, add the length check.

## Beyond roman numerals

For an integer parser: regex or grammar check, not just `parseInt`.
For a date parser: ISO format check, not just "any string".
For ANY parser: explicit non-empty check before the structural test.

## How to read the test set

Walk every input the "throws on invalid input" tests pass. Some are
obviously bad (negative numbers, type mismatches). Some are subtly bad
(`"IIII"` — looks roman, isn't). Some are insidious (`""` — passes loose
regex by accident). Your validation must reject **all** of them. If even
one slips through, you fail that test and the run becomes a scar.

## Why this seed exists

Roman-numerals Ring 2 was failing 1/18 tests stably because devstral wrote
a structurally correct regex that happened to match `""`. The seed text
about "structural validation" got the model 17/18 tests; the empty-string
case needed an explicit call-out.
