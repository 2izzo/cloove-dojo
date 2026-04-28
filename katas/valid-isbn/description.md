# Valid ISBN-10

Implement a function that returns `true` if a given string is a valid
ISBN-10 number, `false` otherwise.

## ISBN-10 rules

An ISBN-10 is a 10-character identifier. Hyphens are allowed and
ignored. The first nine characters are digits 0-9. The tenth character
is either a digit 0-9 or the letter `'X'` (uppercase only), representing
the value 10 in the checksum.

The checksum: take the digit values `d1, d2, ..., d10` (where `'X'` is
10 in position 10), and verify

```
1*d1 + 2*d2 + 3*d3 + ... + 10*d10 ≡ 0  (mod 11)
```

## Behavior

```
isValidIsbn10("0306406152")    → true
isValidIsbn10("0-306-40615-2") → true   // hyphens ignored
isValidIsbn10("0471958697")    → true
isValidIsbn10("0-19-852663-X") → true   // X check digit
isValidIsbn10("123456789X")    → true
isValidIsbn10("3598215088")    → false
isValidIsbn10("359821507")     → false  // too short
isValidIsbn10("X123456789")    → false  // X only valid in position 10
isValidIsbn10("")              → false
```

## Constraints

- Strip hyphens before validation.
- Length after stripping must be exactly 10.
- First 9 chars must be `0-9`. Tenth char must be `0-9` or `X`.
- Apply the weighted checksum.
- Never throws — invalid input returns `false`.
