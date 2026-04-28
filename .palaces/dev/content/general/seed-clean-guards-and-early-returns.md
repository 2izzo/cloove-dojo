---
type: seed
cloove: dev
topic: clean-guards-and-early-returns
tags: [clean-code, refactor, control-flow, guard-clauses]
applies_to: all-katas
---

# Seed — Prefer guard clauses + early return over nested if/else

`else` is an anti-pattern when the `if` branch ends in a return, throw, or
break. Every nested `else` adds a level of indentation and a level of
cognitive load. Most can be flattened into a sequence of guards followed
by the main path.

## The pattern

```ts
// ANTI-PATTERN — pyramid of nested else
function process(input: Input): Output {
  if (input != null) {
    if (input.valid) {
      if (input.items.length > 0) {
        return doWork(input);
      } else {
        return emptyResult();
      }
    } else {
      throw new Error("invalid");
    }
  } else {
    throw new Error("null");
  }
}

// CLEAN — guard clauses, flat main path
function process(input: Input): Output {
  if (input == null) throw new Error("null");
  if (!input.valid) throw new Error("invalid");
  if (input.items.length === 0) return emptyResult();
  return doWork(input);
}
```

The guard version reads top-to-bottom: each guard rejects one bad case
and exits. Once you reach the bottom, the input is known good. No
indentation pyramid, no `else` ladders.

## When this applies

- After validating input (length checks, type checks, range checks)
- After detecting a special case that has its own short answer
- After reaching a terminal state (cap, sentinel, complete)
- Anywhere a branch ends in `return`, `throw`, `continue`, or `break`

## When it doesn't

- When both branches need to compute and combine results — keep the if/else
- When branches are mutually exclusive enumerations of equal weight — see
  the polymorphic-dispatch seed for that case

## Refactoring legacy code

When you find legacy code with deep nesting (3+ levels of `if`/`else`),
the refactor almost always wins by:

1. Identifying each `else`-after-return and removing the `else`
2. Pulling validation conditions to the top as guards
3. Letting the main path live at indent level 1, not level 4

The behavior is preserved — every input still routes through the same
checks in the same order. Only the shape is cleaner.

## Why this seed exists

Legacy code in refactor katas tends to grow indentation pyramids over
time as new cases get nested into existing branches. Reading the code
becomes a stack-tracking exercise. Guard clauses flatten the structure
without changing the behavior, making the refactor obviously cleaner
than the legacy. Apply this pattern wherever you see `else` after a
terminating statement.
