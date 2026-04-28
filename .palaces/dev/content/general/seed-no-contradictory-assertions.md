---
type: seed
cloove: dev
topic: no-contradictory-assertions
tags: [testing, vitest, assertions, clean-code]
applies_to: all-katas
---

# Seed — Two assertions for the same call must agree, not enumerate alternatives

A single `it(...)` block is one test case. Every assertion inside it
must be **simultaneously true** for the case to pass — assertions are
AND'd, not OR'd. Writing two assertions on the same expression with
different expected values is a contradiction; one of them WILL fail
on every run.

## The trap

When a problem says "any of these answers is valid," it's tempting to
encode the alternatives as multiple assertions. That's wrong:

```ts
// WRONG — both assertions must hold; one will always fail
it("finds a shortest path", () => {
  expect(shortestPath(graph, "A", "E")).toEqual(["A", "B", "D", "E"]);
  expect(shortestPath(graph, "A", "E")).toEqual(["A", "C", "D", "E"]);
});
```

`shortestPath(graph, "A", "E")` returns ONE value. Two different
expected values means at least one assertion fails. The test reports
0/N pass even though the impl might be correct.

## The fix

When the spec allows alternatives, assert on the **invariant** that
all valid answers share — length, start, end, set membership — not on
a specific concrete answer:

```ts
// RIGHT — assert what's true for ANY valid answer
it("finds a shortest path of correct length", () => {
  const path = shortestPath(graph, "A", "E");
  expect(path).not.toBeNull();
  expect(path!.length).toBe(4);
  expect(path![0]).toBe("A");
  expect(path![path!.length - 1]).toBe("E");
});
```

Or, if you really want to permit two specific outputs, use
`expect(...).toSatisfy(...)` or a manual disjunction:

```ts
const path = shortestPath(graph, "A", "E");
const valid =
  JSON.stringify(path) === JSON.stringify(["A", "B", "D", "E"]) ||
  JSON.stringify(path) === JSON.stringify(["A", "C", "D", "E"]);
expect(valid).toBe(true);
```

## Why this seed exists

A test case where two assertions on the same call assert different
values is a guaranteed failure regardless of the impl. The model
sometimes encodes "any of these works" as a sequence of equality
asserts, mistaking sequential statements for alternation. Always
ensure assertions in one `it` block are simultaneously satisfiable.
