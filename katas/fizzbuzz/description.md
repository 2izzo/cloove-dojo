# FizzBuzz

Implement a function that returns an array of length `n` (1-indexed) where:

- For multiples of 3, the entry is `"Fizz"`.
- For multiples of 5, the entry is `"Buzz"`.
- For multiples of both 3 and 5, the entry is `"FizzBuzz"`.
- Otherwise, the entry is the number as a string.

## Behavior

```
fizzbuzz(0)  → []
fizzbuzz(1)  → ["1"]
fizzbuzz(15) → ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]
```

## Constraints

- `n` is a non-negative integer. `fizzbuzz(0)` returns `[]`.
- Throw on negative `n`.
- All entries are strings, including the numeric ones.
