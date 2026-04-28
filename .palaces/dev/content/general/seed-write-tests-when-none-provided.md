---
type: seed
cloove: dev
topic: write-tests-when-none-provided
tags: [tdd, ring2, tests, contract-reading]
applies_to: any-kata-where-tests-are-not-provided
---

# Seed — When no tests are provided, you MUST write them first

If the kata prompt does not include a "Tests:" section with test code, that
means **you are responsible for writing the tests**. This is not optional. A
solution that emits only the implementation file is a complete failure of
the task — the runner has no way to verify behavior, and "0/0 tests
passing" is a scar.

## How to recognize this case

The kata prompt has these sections:

- "Description" — what the problem is
- "Architecture" — design hints (sometimes present)
- "Tests" — provided test code (sometimes absent)

If "Tests" is missing or empty, you are in **TDD mode**. Write tests first,
then write the implementation that makes them pass.

## What to emit

Always emit BOTH files — one test file and one implementation file:

```
===FILE: tests/<name>.test.ts===
import { describe, it, expect } from "vitest";
import { /* symbols */ } from "../src/<name>";

describe("<name>", () => {
  it("...", () => {
    expect(...).toBe(...);
  });
});
===END===

===FILE: src/<name>.ts===
export class /* or function */ ... {
  ...
}
===END===
```

Both blocks. Same response. Tests in `tests/`, implementation in `src/`.

## How many tests

Aim for the test set the kata description implies. For bowling-game:
gutter game, all-ones, spare, strike, perfect game. For roman-numerals: at
least the 1, 4, 9, 49, 99, 1999 boundary cases plus an "invalid input"
throw test. Cover the main rules described in the architecture, not just
one happy path.

## Why this seed exists

Devstral on bowling-game Ring 2 (tests removed) was scoring 0/15 because
it interpreted "implement bowling game" as "implement only" and never
emitted a test file. vitest then found nothing to run, every run was a
SCAR. The seeds about *how* to write tests (vitest imports, structural
validation) don't help if no test file gets written in the first place.

Default behavior: if you don't see a "Tests" section, write one.
