# Architecture

## Public API

```typescript
export function shortestPath(
  graph: Record<string, string[]>,
  start: string,
  end: string,
): string[] | null;
```

Single exported function. Returns the path array or null.

## Implementation guidance

Standard BFS:

1. Validate `start` and `end` are in `graph`. If not, return null.
2. If `start === end`, return `[start]`.
3. Use a queue of nodes-to-visit, a `visited` set, and a `parent` map
   (node → predecessor) to reconstruct the path.
4. Pop nodes one at a time; for each unvisited neighbor, set parent
   and enqueue. Stop when you reach `end`.
5. Walk parent pointers backward from `end` to `start` to build the
   path. Reverse and return.

Use a real queue or a dequeueable list — `array.shift()` is O(n) and
can be slow on large graphs, but is acceptable for these tests.
