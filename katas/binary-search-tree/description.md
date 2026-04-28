# Binary Search Tree

Implement a binary search tree (BST) of numbers with three operations:

- `insert(value)` — adds a value to the tree, preserving BST order.
- `contains(value)` — returns true if the value is in the tree, false
  otherwise.
- `inOrder()` — returns the values as a sorted ascending array.

## Behavior

```
const tree = new BST();
tree.contains(5)              // false
tree.insert(5).insert(3).insert(8).insert(1).insert(4);
tree.contains(3)              // true
tree.contains(7)              // false
tree.inOrder()                // [1, 3, 4, 5, 8]
```

## Constraints

- `insert` returns the tree (for chaining).
- Inserting an already-present value is a no-op (no duplicates allowed).
- `inOrder()` returns a new array each call; it does not mutate the tree.
- The tree never throws on any input.
- You do NOT need to balance the tree. A naive insertion order is fine
  (the tests don't check shape, only ordering).
