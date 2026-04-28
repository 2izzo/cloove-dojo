---
type: seed
cloove: dev
topic: clean-polymorphic-dispatch
tags: [clean-code, refactor, polymorphism, strategy, dispatch]
applies_to: all-katas
---

# Seed — Replace type-discriminator if/else with polymorphism or dispatch

When you see a long chain of conditionals discriminating on a type field
(`if (x.kind === "A") ... else if (x.kind === "B") ...`), the type itself
is the polymorphism opportunity. The clean refactor replaces the
conditional ladder with a strategy table, a polymorphic method dispatch,
or a switch on a sum type — anywhere the type maps directly to behavior
without nested branching.

## The pattern

```ts
// ANTI-PATTERN — type-discriminator chain
function update(item: Item): void {
  if (item.type === "normal") {
    item.value = item.value - 1;
  } else if (item.type === "special-A") {
    item.value = item.value + 1;
  } else if (item.type === "frozen") {
    // do nothing
  } else if (item.type === "special-B") {
    if (item.daysLeft < 5) item.value = item.value + 3;
    else if (item.daysLeft < 10) item.value = item.value + 2;
    else item.value = item.value + 1;
  }
}

// CLEAN — table dispatch, behavior named per type
const updaters: Record<ItemType, (item: Item) => void> = {
  normal:    (i) => { i.value -= 1; },
  "special-A": (i) => { i.value += 1; },
  frozen:    () => {},
  "special-B": updateSpecialB,
};

function updateSpecialB(i: Item): void {
  if (i.daysLeft < 5) i.value += 3;
  else if (i.daysLeft < 10) i.value += 2;
  else i.value += 1;
}

function update(item: Item): void {
  updaters[item.type](item);
}
```

Each behavior gets its own named function, the dispatch is one lookup,
and adding a new type doesn't touch existing code — you add an entry.

## Strategy pattern (object form)

When the behaviors carry state or share a richer interface, use the
strategy pattern with classes:

```ts
abstract class Strategy {
  abstract update(item: Item): void;
}

class NormalStrategy extends Strategy { ... }
class SpecialAStrategy extends Strategy { ... }
// ...

const strategies = new Map<ItemType, Strategy>([
  ["normal", new NormalStrategy()],
  ["special-A", new SpecialAStrategy()],
  // ...
]);

function update(item: Item): void {
  strategies.get(item.type)?.update(item);
}
```

## How to recognize the opportunity

If you find:

- Two or more `if/else if` clauses comparing the same field to different
  literal values
- A `switch` statement on a type/kind/name field
- The same set of branches appearing in multiple places (update, render,
  serialize, etc.)

…the type field IS the polymorphism, and a dispatch table or strategy
pattern is the clean replacement.

## Preserve the public API

The dispatch table is internal restructuring. The function that callers
use stays the same name, the same signature, the same contract. The
strategies and dispatch map are implementation detail.

## Why this seed exists

Legacy code with type-discriminator chains accretes special cases over
time, growing a pyramid of nested branches that's hard to read and easy
to break when you add a case. Replacing the chain with a dispatch table
makes the code's intent literal: "these types map to these behaviors."
The refactor preserves behavior while making each case independently
readable.
