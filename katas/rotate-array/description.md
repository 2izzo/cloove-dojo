# Rotate Array

Implement a function that rotates an array to the right by `k`
positions. The rotation **must be done in-place** — do not allocate a
new array of the same size as the input.

## Behavior

```
const a = [1, 2, 3, 4, 5];
rotate(a, 2);
a  // [4, 5, 1, 2, 3]

const b = [1, 2, 3];
rotate(b, 5);
b  // [2, 3, 1]   // k > length, normalize via modulo (5 mod 3 = 2)

rotate([], 3);              // [] (empty stays empty)
rotate([1], 5);             // [1]
rotate([1, 2, 3, 4, 5], 0); // [1, 2, 3, 4, 5]
rotate([1, 2, 3], -1);      // [2, 3, 1]   // negative rotates left
```

## Constraints

- The function returns `void` (or returns the input array, your choice).
- The input array IS modified — `arr` must equal the rotated form
  after the call.
- Allocating a single full-size copy is forbidden. The canonical
  in-place algorithm uses three reverses (reverse the whole array,
  reverse the first k, reverse the rest); a swap-cycles approach also
  qualifies.
- Negative `k` rotates left by `|k|`.
- `k` modulo array length, including for negative values.
- Empty array and single-element array are no-ops.
