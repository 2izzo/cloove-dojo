# Priority Queue (Min-Heap)

Implement a priority queue backed by a binary min-heap, with these
operations:

- `push(value)` — insert a value (lower = higher priority).
- `pop()` — remove and return the minimum. Throws on empty.
- `peek()` — return the minimum without removing. Throws on empty.
- `size` — current number of elements.

## Behavior

```
const pq = new PriorityQueue<number>();
pq.size                    // 0
pq.push(5).push(2).push(8).push(1).push(3);
pq.peek()                  // 1
pq.pop()                   // 1
pq.pop()                   // 2
pq.size                    // 3
```

## Constraints

- `push` returns the queue (for chaining).
- `pop`/`peek` throw on empty.
- Generic over T, with a comparator: `new PriorityQueue<T>(cmp)` where
  `cmp(a, b)` returns negative if `a` has higher priority. Default
  comparator is numeric `(a, b) => a - b`.
- Use a real binary heap stored in an array. The point is the data
  structure, not a sorted list.
