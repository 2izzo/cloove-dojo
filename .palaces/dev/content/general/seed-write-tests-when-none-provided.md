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
  it("<behavior>", () => {
    expect(/* call */).toBe(/* result */);
  });
});
===END===

===FILE: src/<name>.ts===
export function /* or class */ ... {
  ...
}
===END===
```

Both blocks. Same response. Tests in `tests/`, implementation in `src/`.

## How to choose what to test

Read the description and architecture. They tell you the rules of the
domain. Your tests should cover:

- The main success path (a normal input → expected output)
- Each rule the description states explicitly
- Each boundary the rules imply (empty input, single-element input, max
  value, exactly-at-threshold values)
- Every "throws on invalid input" condition the description mentions

Don't write only happy-path tests; the runner credits all-tests-passing,
and missing edge cases means missing tests means missing pass conditions.

## Why this seed exists

Models trained on "implement X" defaults to writing only the implementation
when given a no-tests prompt — the prompt's verb is "implement," and the
model takes that as the entire scope. The TDD context (Ring 2) needs an
explicit reframing: tests are part of the deliverable, not optional.
