---
type: seed
cloove: dev
topic: refactor-preserve-public-api
tags: [refactor, exports, legacy, public-api]
applies_to: any-kata-with-legacy-code
---

# Seed — Refactoring keeps the public API identical

When you refactor legacy code, the **public surface** stays the same: same
exported names, same `export` keywords, same constructor signatures, same
public method names. Internal organization is yours to restructure
(extract helpers, split methods, rename privates) — but external callers
must import and instantiate the new code with the exact same syntax they
used for the old code.

## The discipline

Before you finish your refactor:

1. Open the legacy file. List every `export` and the symbol each one
   exposes — class names, function names, type names.
2. Open your refactored file. Verify each of those symbols is still
   exported, with the same name, the same shape (class vs function vs
   type), and the same constructor or call signature.
3. If consumers do `import { Foo, Bar } from "../src/file"`, both `Foo`
   and `Bar` must be `export`ed in your refactor.

## What "internal" means

You can introduce new helpers, strategies, sub-classes, sub-functions —
none of those need to be exported. They are implementation detail. Only
the symbols the legacy file exported are part of the public contract.

## Common miss

```ts
// WRONG — refactor lost the export keyword
class Foo {
  constructor(arg: T) { ... }
  publicMethod(): U { ... }
}

// Test imports { Foo } and gets undefined.
// Every test fails: "Foo is not a constructor".
```

```ts
// RIGHT — preserves public surface
export class Foo {
  constructor(arg: T) { ... }
  publicMethod(): U { ... }
}

// Internal helpers stay un-exported by design:
class FooHelper { ... }
class FooDispatcher { ... }
```

## Type imports too

If consumers do `import type { Bar } from "../src/file"`, the type must
also be `export`ed. Even though TypeScript-only types vanish at compile,
the syntactic re-export is required for the import to resolve.

## Why this seed exists

Refactor katas reward beautiful internal restructuring (Strategy Pattern,
extracted helpers, clean dispatch tables) — but a refactor that loses the
external `export` of the original class makes every consumer's import
return undefined. The result: clean code that no test can reach. Always
preserve what the legacy file exported.
