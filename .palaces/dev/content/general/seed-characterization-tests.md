---
type: seed
cloove: dev
topic: characterization-tests
tags: [refactor, legacy, characterization, tests]
applies_to: any-kata-with-legacy-code
---

# Seed — Characterization tests document the LEGACY code, not the description

When a kata gives you legacy code AND a description, the description is the
*intent*; the legacy code is the *truth*. Characterization tests must match
what the legacy code actually does. If they match the description and the
description disagrees with the legacy, every test fails — before and after
refactoring.

## The discipline

For each input case you want to test:

1. **Trace the legacy code by hand.** Read the actual branches, the actual
   loop, the actual conditions. Compute the output line by line.
2. **Write the assertion against THAT value.** Not what the description says
   should happen — what the legacy code actually does.
3. If the legacy and description disagree, the description is a feature
   request for AFTER the refactor. Your characterization tests pin the
   legacy's actual behavior. Leave a `// TODO: legacy diverges from spec
   here` comment if the gap matters.

## The shape, not the answer

```ts
// WRONG — wrote what the SPEC says
expect(legacyOutput(input)).toBe(specResult);

// RIGHT — wrote what the LEGACY actually computes
expect(legacyOutput(input)).toBe(actualLegacyResult);
```

You can only know `actualLegacyResult` by reading the legacy code. Don't
guess from the description. Don't run the legacy mentally and stop at the
first branch. Walk every condition.

## What to look for

- Branches the description never mentions (legacy might handle a case the
  spec ignores)
- Edge cases where the legacy differs from the description in a single
  detail (off-by-one, a missing case, a hard-coded value)
- Boundary conditions (empty input, max value, exactly-zero, exactly-equal)

When you spot a difference, the legacy wins for the test. Pin its behavior.
The refactor preserves it. The description's version comes later.

## Then refactor

With characterization tests green, refactor the legacy code keeping every
test green. The tests are your safety net; if they go red, you broke
something. Restructure freely as long as the outputs are unchanged.

## Why this seed exists

When a model writes tests against the description without consulting the
legacy, every test fails — the description and the legacy disagree on
edge cases by design (that's why it's a refactoring kata). Characterization
is its own discipline: trust the code, doubt the prose, write what you
trace.
