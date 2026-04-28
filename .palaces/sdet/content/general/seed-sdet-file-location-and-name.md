---
type: seed
cloove: sdet
topic: e2e-file-location-and-name
tags: [e2e, vitest, file-location]
applies_to: any-fullstack-kata
---

# Seed — E2E test file MUST live under `e2e/` and end in `.e2e.test.ts`

The runner invokes `npm run test:e2e` which scans **only** the `e2e/`
directory and matches files against vitest's include pattern. Two specific
mistakes silently skip the entire test suite:

- File placed under `tests/` or `src/__tests__/` instead of `e2e/`
- File named `<kata>.e2e.ts` (missing the `.test` infix)

Either mistake produces a 0/0 e2e result — vitest never runs your tests
and the SDET phase scores 0.

## What to emit

```
===FILE: e2e/<kata>.e2e.test.ts===
import puppeteer, { Browser, Page } from "puppeteer";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

let browser: Browser;
let page: Page;

describe("<kata> E2E", () => {
  // ...
});
===END===
```

## Why this seed exists

The SDET prompt does state the rule, but it's one of many constraints in a
long prompt. Every observed failure where the SDET cloove placed tests
under `tests/` or omitted `.test` from the filename is recoverable craft —
make it sticky across runs.
