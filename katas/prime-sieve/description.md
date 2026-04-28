# Prime Sieve

Implement a function that returns all prime numbers up to and including a
given limit `n`, using the Sieve of Eratosthenes (or any other algorithm
that produces the same output).

## Behavior

```
primesUpTo(0)  → []
primesUpTo(1)  → []
primesUpTo(2)  → [2]
primesUpTo(10) → [2, 3, 5, 7]
primesUpTo(30) → [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
```

## Constraints

- Result must be a sorted ascending array of primes.
- 0 and 1 are NOT prime; the result for any `n < 2` is `[]`.
- `n` is an integer ≥ 0. **Throw on negative `n`** with a clear error.
- Performance is not graded for this kata, but a sieve is more elegant
  than trial division.
