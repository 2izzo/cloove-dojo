---
type: seed
cloove: dev
topic: throws-validate-structure
tags: [validation, throws, ring1, contract-reading]
applies_to: any-kata-with-throws-tests
---

# Seed — `throws on invalid input` means structural validation, not just type checks

When a test does:

```ts
expect(() => roman("IIII")).toThrow();
expect(() => roman("VV")).toThrow();
expect(() => roman("XCC")).toThrow();
```

The implementation must reject inputs that are *well-formed strings* but violate the **domain grammar**. Type-checking (`if (typeof n !== 'string') throw`) is not enough — `"IIII"` is a perfectly good string. You need to validate the structure.

## What this looks like in practice

For Roman numerals:

```ts
const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function fromRoman(s: string): number {
  if (!ROMAN_RE.test(s)) throw new Error(`invalid roman numeral: ${s}`);
  // ... actual conversion
}
```

For an integer parser: regex or grammar check, not just `parseInt`.
For a date parser: ISO format check, not just "any string".

## How to read the test set

Look at every input the "throws on invalid input" tests pass. Some are obviously bad (negative numbers, empty strings). Others are subtly bad (`"IIII"` — looks roman, isn't). Your validation must reject **all** of them. If even one slips through, you fail that test.

## Why this seed exists

System prompt already says "throws on invalid input is a hard constraint." This seed reinforces *what counts as invalid*: not just type-wrong, but **structurally outside the domain**. Always reach for a regex, whitelist, or grammar check before reaching for `typeof`.
