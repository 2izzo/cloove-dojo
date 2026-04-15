# Architecture: Roman Numerals

## File Structure

```
roman.ts       — toRoman() and fromRoman() exports
roman.test.ts  — Tests
```

## Design Hints

- For toRoman: use a lookup table of value-symbol pairs in descending order, including subtractive forms (900=CM, 400=CD, 90=XC, etc.)
- For fromRoman: walk the string left to right. If current symbol < next symbol, subtract; otherwise add.
- Validate inputs: throw for out-of-range numbers, throw for invalid Roman strings
