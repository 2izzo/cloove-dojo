---
type: pattern
topic: strategy-dispatch-by-key
tags: [refactor, polymorphism, strategy-pattern, dispatch-table]
shape: design-pattern
applies_to: all-katas
---

# Pattern — Strategy dispatch by string key

When code branches on a discriminator field — `if (kind === "A") ...
else if (kind === "B") ...` — the type field IS the polymorphism
opportunity. Replace the chain with a dispatch table or strategy
classes; each behavior gets its own named function or class.

## Function-table shape (lighter)

```ts
type Operation = "double" | "square" | "negate";

const operations: Record<Operation, (n: number) => number> = {
  double: (n) => n * 2,
  square: (n) => n * n,
  negate: (n) => -n,
};

function apply(op: Operation, n: number): number {
  return operations[op](n);
}
```

Adding a new operation is one line in the table; existing code is
untouched. The discriminator is no longer a chain of conditionals,
just a lookup.

## Strategy-class shape (heavier; for stateful or richer behaviors)

```ts
abstract class Strategy {
  abstract apply(input: Input): Output;
  abstract describe(): string;
}

class StrategyA extends Strategy {
  apply(i: Input): Output { /* ... */ }
  describe(): string { return "A"; }
}

class StrategyB extends Strategy {
  apply(i: Input): Output { /* ... */ }
  describe(): string { return "B"; }
}

const strategies = new Map<string, Strategy>([
  ["A", new StrategyA()],
  ["B", new StrategyB()],
]);

function process(name: string, i: Input): Output {
  const s = strategies.get(name);
  if (!s) throw new Error(`unknown strategy: ${name}`);
  return s.apply(i);
}
```

## When refactoring legacy code

The legacy if/else ladder usually contains all the special cases.
Preserve them by keeping the dispatch table keyed on the EXACT
strings the legacy compared against — including any "marketing
names" like `"Sulfuras, Hand of Ragnaros"`. Don't simplify the keys
during refactor; the public contract (the names callers pass in) is
part of the legacy's public surface.

## Why this pattern

Long if/else chains keyed on a type field are a code smell with two
costs: each new case touches the same function (merge conflicts,
churn) and the case logic is interleaved (hard to read one branch
without seeing all). Dispatch tables flatten the structure, name
each branch, and make adding cases additive.

Use the function-table shape when each behavior is small and
stateless. Use the strategy-class shape when behaviors share state or
implement a richer interface.
