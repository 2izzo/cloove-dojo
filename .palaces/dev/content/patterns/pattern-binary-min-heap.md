---
type: pattern
topic: binary-min-heap
tags: [data-structure, heap, priority-queue, sift-up, sift-down]
shape: data-structure
applies_to: all-katas
---

# Pattern — Binary min-heap (sift-up / sift-down)

A binary heap stores its tree in a flat array. For a node at index `i`:
parent is `(i-1) >> 1`, left child is `2*i+1`, right child is `2*i+2`.
The heap invariant for a min-heap: every parent ≤ each of its children.

## Push (sift up)

Append to the end, then bubble up while smaller than parent.

```ts
function push(heap: number[], value: number): void {
  heap.push(value);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}
```

## Pop (sift down)

Save the root, move the last element to the root, then bubble down to
the smaller child while larger.

```ts
function pop(heap: number[]): number {
  if (heap.length === 0) throw new Error("heap is empty");
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    const n = heap.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < n && heap[l] < heap[smallest]) smallest = l;
      if (r < n && heap[r] < heap[smallest]) smallest = r;
      if (smallest === i) break;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      i = smallest;
    }
  }
  return top;
}
```

## Generalizing to any comparator

Replace `<=` and `<` with a `cmp` function that returns negative if `a`
has higher priority. Min-heap is `cmp(a, b) = a - b`. Max-heap is
`cmp(a, b) = b - a`. The sift loops are otherwise identical.

## Why this pattern

Heaps are O(log n) push and pop, O(1) peek. The sift-up/sift-down
loops have subtle off-by-ones (especially the "smaller of two
children" branch in sift-down) that are easy to derive incorrectly.
Use this shape verbatim and adapt the comparator to the problem.
