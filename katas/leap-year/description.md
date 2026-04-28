# Leap Year

Implement a function that returns `true` if a given year is a leap year
in the Gregorian calendar, `false` otherwise.

## Behavior

A year is a leap year if:

- It is divisible by 4, AND
- It is NOT divisible by 100, OR
- It IS divisible by 400.

```
isLeapYear(2024) → true   // divisible by 4, not by 100
isLeapYear(2025) → false  // not divisible by 4
isLeapYear(2100) → false  // divisible by 100, not by 400
isLeapYear(2000) → true   // divisible by 400
isLeapYear(1900) → false  // divisible by 100, not by 400
isLeapYear(0)    → true   // divisible by 400
isLeapYear(4)    → true
```

## Constraints

- Input is an integer year (any sign — historical years before year 1
  follow the same arithmetic rules in this kata).
- Returns a strict boolean.
- Never throws.
