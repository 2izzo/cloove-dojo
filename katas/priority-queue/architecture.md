# Architecture

## Public API

```typescript
export class PriorityQueue<T> {
  constructor(cmp?: (a: T, b: T) => number);
  push(value: T): this;
  pop(): T;          // throws on empty
  peek(): T;         // throws on empty
  size: number;
}
```

## Implementation guidance

Standard binary min-heap stored in a plain array, 0-indexed. For a
node at index `i`:

- parent: `Math.floor((i - 1) / 2)`
- left child: `2 * i + 1`
- right child: `2 * i + 2`

`push`: append to the end, sift up while smaller than parent.
`pop`: swap root with last, shrink array, sift down the new root while
larger than the smaller child.

The sift-up / sift-down loops are the canonical heap operations —
worth getting right rather than improvising.
