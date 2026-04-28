---
type: seed
cloove: dev
topic: characterization-tests
tags: [refactor, legacy, characterization, tests, gilded-rose]
applies_to: any-kata-with-legacy-code
---

# Seed — Characterization tests document the LEGACY code, not the description

When a kata gives you legacy code AND a description, the description is the
*intent*; the legacy code is the *truth*. Characterization tests must match
what the legacy code actually does. If they match the description and the
description disagrees with the legacy, every test fails — before and after
refactoring.

## How to write the test

For each input case: trace the legacy code by hand, compute the actual
output, write the assertion against THAT. Not the description's version.

If the legacy and description disagree, the description is a feature
request for AFTER the refactor. The characterization tests pin the
legacy's actual behavior.

## Common trap (Gilded Rose)

The description says "Conjured items degrade twice as fast." But the legacy
`updateQuality` has no `'Conjured'` case — it degrades like a normal item.

```ts
// WRONG — description-driven
it("Conjured degrades 2x", () => {
  items = [{ name: "Conjured", sellIn: 3, quality: 6 }];
  new GildedRose(items).updateQuality();
  expect(items[0].quality).toBe(4);   // FAIL — legacy gives 5
});

// RIGHT — legacy-driven
it("Conjured currently behaves like a normal item (legacy gap)", () => {
  items = [{ name: "Conjured", sellIn: 3, quality: 6 }];
  new GildedRose(items).updateQuality();
  expect(items[0].quality).toBe(5);   // matches legacy
});
```

## Edge cases worth checking by hand

- **Aged Brie sellIn=2 quality=0:** after one tick → quality=1, not 2.
  The +2 only kicks in when sellIn drops below 0.
- **Backstage sellIn=5 quality=49:** caps at 50, not 51.
- **Sulfuras:** never changes. sellIn stays. Quality stays 80.

## Then refactor

Once tests are green against the legacy, refactor the code keeping the
tests green. The tests are the safety net.

## Why this seed exists

Gilded-rose Ring 2 was failing 0/N tests stably because devstral wrote
tests for the description's intended behavior, not the legacy code's.
The refactor then matched the description and the tests failed against
either codebase. Trust the code, doubt the prose.
