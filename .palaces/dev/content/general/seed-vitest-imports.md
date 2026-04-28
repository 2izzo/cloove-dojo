---
type: seed
cloove: dev
topic: vitest-imports
tags: [vitest, imports, testing]
applies_to: any-kata-with-vitest
---

# Seed — Always import vitest globals

The dojo's test runner is **vitest**, invoked via `vitest run`. By default, vitest does not expose `describe`, `it`, `expect`, `beforeEach`, etc. as globals. You must import them.

## The right pattern

```ts
import { describe, it, expect, beforeEach } from "vitest";

describe("Calculator", () => {
  it("adds", () => {
    expect(1 + 1).toBe(2);
  });
});
```

## What goes wrong without the import

```ts
// WRONG — looks like jest, breaks in vitest
describe("Calculator", () => { ... });
```

vitest throws `ReferenceError: describe is not defined`, the test file fails to load, and every test inside it is unreachable. The dev cloove sees "0 tests passing" and the run is marked a scar.

## Why this seed exists

This is Bug 28 from the 2026-04-23 ring-ladder session. Small open-weight coding models default to jest-style globals because most training data shows jest. The fix is one line at the top of every test file. Always emit the import.
