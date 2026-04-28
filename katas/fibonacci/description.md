# Fibonacci

Implement a function that returns the nth Fibonacci number, where
`fib(0) = 0`, `fib(1) = 1`, and `fib(n) = fib(n-1) + fib(n-2)` for `n ≥ 2`.

## Behavior

```
fib(0)  → 0
fib(1)  → 1
fib(2)  → 1
fib(10) → 55
fib(30) → 832040
fib(50) → 12586269025
```

## Constraints

- Input `n` is a non-negative integer.
- Result for `n ≥ 2` follows the standard recurrence.
- **Performance matters**: `fib(50)` should return in well under one
  second. A naive recursive implementation will time out.
- Throw on negative `n`.
