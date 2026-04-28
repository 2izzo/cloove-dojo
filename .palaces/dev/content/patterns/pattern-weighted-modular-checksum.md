---
type: pattern
topic: weighted-modular-checksum
tags: [validation, checksum, modular-arithmetic, identifier]
shape: algorithm
applies_to: all-katas
---

# Pattern — Weighted modular checksum

Many real-world identifiers (book numbers, credit cards, tracking
codes, EAN/GTIN barcodes) carry a check digit computed by a weighted
sum modulo some base. The pattern is the same regardless of the
specific weights or base.

## The shape

```ts
function isValid(
  rawInput: string,
  weights: number[],   // one weight per character position
  base: number,        // modulus the sum should equal 0 against
  toDigit: (c: string, position: number) => number, // char-to-value mapping
): boolean {
  // 1. Strip noise characters (hyphens, spaces, etc).
  const s = rawInput.replace(/[^0-9A-Za-z]/g, "");

  // 2. Length must match the weight vector exactly.
  if (s.length !== weights.length) return false;

  // 3. Compute weighted sum.
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    let value: number;
    try {
      value = toDigit(s[i], i);
    } catch {
      return false; // character not in the allowed set at this position
    }
    sum += weights[i] * value;
  }

  // 4. Valid iff sum is congruent to 0 modulo base.
  return sum % base === 0;
}
```

## Concrete instantiations

- **ISBN-10:** weights `[1, 2, 3, ..., 10]`, base `11`, position 9
  allows `'X'` (=10) in addition to digits. Other positions: digits
  only.
- **Luhn (credit cards):** weights alternate `[2, 1, 2, 1, ...]` from
  the right; digits doubled and summed (with 9 subtracted from
  doubled values ≥ 10). Base `10`.
- **EAN-13:** weights alternate `[1, 3, 1, 3, ...]`. Base `10`.
- **UPC-A:** weights `[3, 1, 3, 1, ...]`. Base `10`.

## The two failure modes that hide in this pattern

1. **Position-dependent character validity.** Some checksums (ISBN-10)
   allow a special character in exactly one position. Validate
   per-position before computing the sum, not after.
2. **Length mismatch silently producing wrong sums.** If the input
   length doesn't match the expected weight vector length, return
   false BEFORE the loop. Don't pad or truncate.

## Why this pattern

The "weighted sum mod base" shape covers an entire family of identifier
formats. Recognize the family and apply this shape verbatim — adapt
the weights, base, and char-to-digit mapping. Don't re-derive the
algorithm from scratch each time.
