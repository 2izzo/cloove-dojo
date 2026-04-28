# Flatten Array

Implement a function that flattens an arbitrarily-nested array of
values into a single flat array, preserving order.

## Behavior

```
flatten([])                       → []
flatten([1, 2, 3])                → [1, 2, 3]
flatten([1, [2, 3]])              → [1, 2, 3]
flatten([1, [2, [3, [4, [5]]]]])  → [1, 2, 3, 4, 5]
flatten([[1, 2], [3], [], [4]])   → [1, 2, 3, 4]
flatten(["a", ["b", ["c"]]])      → ["a", "b", "c"]
flatten([1, [null, [undefined]]]) → [1, null, undefined]
```

## Constraints

- Input is a (possibly nested) array of any values. Non-array elements
  pass through verbatim, including `null` and `undefined`.
- Empty sub-arrays disappear (they contribute zero elements).
- Order is preserved depth-first.
- Arbitrary depth of nesting must be supported (test cases go to depth
  5). Recursion is fine; iteration with a stack is also fine; the
  built-in `Array.prototype.flat(Infinity)` works too — your choice.
- Never mutate the input.
