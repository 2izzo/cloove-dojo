---
type: pattern
topic: bfs-shortest-path
tags: [graph, bfs, shortest-path, parent-pointers, traversal]
shape: algorithm
applies_to: all-katas
---

# Pattern — BFS shortest path with parent pointers

Breadth-first search on an unweighted graph finds shortest paths by
edge count. The classic shape uses a queue of nodes-to-visit, a visited
set, and a parent map so the path can be reconstructed at the end.

## The shape

```ts
function shortestPath<T>(
  neighbors: (node: T) => T[],
  start: T,
  goal: T,
  isStartValid: () => boolean = () => true,
  isGoalValid: () => boolean = () => true,
): T[] | null {
  if (!isStartValid() || !isGoalValid()) return null;
  if (start === goal) return [start];

  const queue: T[] = [start];
  const visited = new Set<T>([start]);
  const parent = new Map<T, T>();

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const n of neighbors(cur)) {
      if (visited.has(n)) continue;
      visited.add(n);
      parent.set(n, cur);
      if (n === goal) {
        // Reconstruct path goal → ... → start
        const path: T[] = [n];
        let p: T | undefined = cur;
        while (p !== undefined) {
          path.push(p);
          p = parent.get(p);
        }
        return path.reverse();
      }
      queue.push(n);
    }
  }
  return null; // unreachable
}
```

## Critical details

- **Mark visited when ENQUEUING, not when dequeuing.** Otherwise a node
  can be queued multiple times before it's first processed, leading to
  redundant work and (in some shapes) incorrect parent pointers.
- **Mark `start` as visited** before the loop begins. Otherwise a
  neighbor's neighbor list could re-enqueue `start`.
- **Reconstruct from goal back to start.** The parent map maps "this
  node was reached via" — walking it backward from goal gives you the
  reversed path.
- **Test reachability separately from path identity.** When multiple
  shortest paths of equal length exist, any one is correct — assert on
  length and endpoints, not the specific node sequence.

## Why this pattern

BFS is the canonical answer for "shortest path in an unweighted graph"
problems — friend-of-friend, fewest-moves puzzles, fewest-edits-with-
unit-cost transformations. The visited-on-enqueue + parent-pointer
shape generalizes to any node type via the `neighbors` callback.
