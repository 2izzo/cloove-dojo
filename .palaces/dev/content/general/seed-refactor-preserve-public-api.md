---
type: seed
cloove: dev
topic: refactor-preserve-public-api
tags: [refactor, exports, legacy, public-api, gilded-rose]
applies_to: any-kata-with-legacy-code
---

# Seed — Refactoring keeps the public API identical

When you refactor legacy code, the **public surface** stays the same: same
class names, same `export` keywords, same constructor signatures, same
public method names. Internal organization is yours to restructure
(extract strategies, split methods, rename privates) — but external
callers must import and instantiate the new code with the exact same
syntax they used for the old code.

If the legacy has `export class GildedRose { constructor(items: Item[]) }`
your refactor must also `export class GildedRose { constructor(items:
Item[]) }`. If you split the logic across helper classes, those are
implementation detail — they don't have to be exported, but `GildedRose`
and any type the consumer imports MUST be exported.

## What to check before you finish

1. Open the legacy file. Note every `export` and the symbols it exports.
2. Open your refactored file. Verify each of those symbols is still
   exported with the same name and shape.
3. If your tests `import { GildedRose, Item } from "../src/gilded-rose"`,
   both `GildedRose` and `Item` must be `export`ed in your refactor.

## Common miss

```ts
// WRONG — refactor lost the export
class GildedRose {
  items: Item[];
  constructor(items: Item[]) { ... }
  updateQuality(): Item[] { ... }
}

// Test fails: TypeError: GildedRose is not a constructor
//             (because import { GildedRose } returns undefined)
```

```ts
// RIGHT — preserves public surface
export class GildedRose {
  items: Item[];
  constructor(items: Item[]) { ... }
  updateQuality(): Item[] { ... }
}

// (NormalItemStrategy, AgedBrieStrategy, etc. — internal helpers,
// stay un-exported by design)
```

## Why this seed exists

Gilded-rose Ring 2 was failing 0/N tests stably with a beautifully-
structured Strategy Pattern refactor — but devstral forgot the `export`
keyword on `GildedRose` and `Item`. Every test failed with "GildedRose
is not a constructor" before any logic ran. The refactor was clean; the
public surface broke. Always preserve what the legacy file exports.
