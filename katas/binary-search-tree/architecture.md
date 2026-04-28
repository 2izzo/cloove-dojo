# Architecture

## Public API

```typescript
export class BST {
  insert(value: number): this;
  contains(value: number): boolean;
  inOrder(): number[];
}
```

## Implementation guidance

Internal node shape:

```typescript
interface Node {
  value: number;
  left: Node | null;
  right: Node | null;
}
```

Track a private `root: Node | null`. Each operation is recursive on the
subtree at the current node:

- `insert(v)`: if `v < node.value`, recurse left; if `v > node.value`,
  recurse right; if equal, do nothing (no duplicates).
- `contains(v)`: walk down using the same comparison; return true on
  match, false on null.
- `inOrder()`: classic in-order traversal — recurse left, push current,
  recurse right.

Iterative implementations work too. Recursion is cleaner for this kata.
