# Architecture

## Public API

```typescript
export class LinkedList<T> {
  push(value: T): this;
  pop(): T;          // throws on empty
  unshift(value: T): this;
  shift(): T;        // throws on empty
  length: number;    // current size
  toArray(): T[];
}
```

## Implementation guidance

Internal node shape:

```typescript
interface Node<T> {
  value: T;
  next: Node<T> | null;
}
```

Track `head`, `tail`, and `length` privately. Tail is critical — without
it, `push` would be O(n). Update both pointers carefully on every
mutation:

- After `push` to a list of size 0, both head and tail point to the new
  node.
- After `pop` from a list of size 1, both head and tail go to null.
- `length` updates on every push/pop/unshift/shift.

Throw on `pop`/`shift` from an empty list.
