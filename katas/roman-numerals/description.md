# Roman Numerals

Convert between Arabic numbers (integers) and Roman numeral strings.

## Rules

| Symbol | Value |
|--------|-------|
| I | 1 |
| V | 5 |
| X | 10 |
| L | 50 |
| C | 100 |
| D | 500 |
| M | 1000 |

**Subtractive notation:** A smaller numeral before a larger one means subtraction:
- IV = 4, IX = 9
- XL = 40, XC = 90
- CD = 400, CM = 900

Valid range: 1-3999 (no zero, no negatives, no 4000+)

## Interface

Implement two functions:
- `toRoman(num: number): string` — convert integer to Roman numeral
- `fromRoman(roman: string): number` — convert Roman numeral to integer

Both should throw on invalid input.
