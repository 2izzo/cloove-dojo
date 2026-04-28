# Graph BFS Shortest Path

Given an unweighted graph (adjacency list) and two nodes, return the
shortest path (by edge count) from start to end as an array of nodes,
or `null` if no path exists.

## Behavior

```
const graph = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D"],
  D: ["B", "C", "E"],
  E: ["D"],
};

shortestPath(graph, "A", "E")  → ["A", "B", "D", "E"]   // or ["A","C","D","E"]
shortestPath(graph, "A", "A")  → ["A"]
shortestPath(graph, "A", "Z")  → null   // Z not in graph
shortestPath(graph, "A", "F")  → null   // F unreachable
shortestPath({}, "A", "B")     → null
```

## Constraints

- Graph is `Record<string, string[]>`. Edges are undirected (the test
  graphs always include reciprocal edges where they exist).
- Start node not in graph → `null`.
- End node not in graph → `null`.
- If start === end, return `[start]`.
- Return value is an array of node names from start to end inclusive,
  or `null` if no path.
- When multiple shortest paths exist, returning any one is correct
  (tests check length and start/end, not the specific path).
- Never throws.
