# Run-Length Encoding

Implement a pair of functions: `encode` collapses runs of identical
characters into the format `<count><char>`, and `decode` is its inverse.

## Behavior

```
encode("AAAABBBCCDAA")   → "4A3B2C1D2A"
encode("")               → ""
encode("XYZ")            → "1X1Y1Z"

decode("4A3B2C1D2A")     → "AAAABBBCCDAA"
decode("")               → ""
decode("1X1Y1Z")         → "XYZ"

decode(encode(s)) === s   // for any well-formed s
```

## Constraints

- Input characters are arbitrary (letters, digits, punctuation, spaces),
  except that `decode` requires its input to be a well-formed RLE string
  — alternating runs of `<digits><single-char>`. Throw on malformed
  decode input.
- Counts in encoded output may be multi-digit. `encode("AAAAAAAAAAAA")`
  is `"12A"`.
- Both functions never throw on empty input — `encode("")` and
  `decode("")` both return `""`.
