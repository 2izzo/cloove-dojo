# Linked List

Implement a singly linked list with the following operations:

- `push(value)` — add to the tail.
- `pop()` — remove and return the tail value. Throws on empty list.
- `unshift(value)` — add to the head.
- `shift()` — remove and return the head value. Throws on empty list.
- `length` — current size as a number (read-only property or method).
- `toArray()` — returns the values as a plain array, head-first.

## Behavior

```
const list = new LinkedList<number>();
list.length              // 0
list.push(1).push(2).push(3);
list.toArray()           // [1, 2, 3]
list.length              // 3
list.unshift(0);
list.toArray()           // [0, 1, 2, 3]
list.pop()               // 3
list.shift()             // 0
list.toArray()           // [1, 2]
```

## Constraints

- `push` and `unshift` return the list (for chaining).
- `pop` and `shift` return the value, throw on empty.
- Use real linked nodes internally — `{ value, next }` — not a wrapped
  array. The point of the kata is the data structure.
- Generic type parameter — `LinkedList<T>` works for any T.
