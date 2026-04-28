# Two Sum

Given an array of integers and a target, return the **indices** of the
two numbers in the array that add up to the target.

## Behavior

```
twoSum([2, 7, 11, 15], 9)   → [0, 1]   // 2 + 7 = 9
twoSum([3, 2, 4], 6)         → [1, 2]  // 2 + 4 = 6
twoSum([3, 3], 6)            → [0, 1]  // duplicates count
```

## Constraints

- Each input has **exactly one** valid pair. You don't need to handle
  the no-solution case in the happy path, but you must throw if the
  input has no valid pair (so a caller passing bad data fails loudly).
- Return value is `[i, j]` with `i < j`.
- An element cannot be paired with itself by index — `twoSum([3, 6], 6)`
  is **not** valid because the only "solution" would be index 0 paired
  with itself. Throw on this case too.
- Order in the input is preserved — the returned indices are positions
  into the original array, not into a sorted version.
