---
type: seed
cloove: sdet
topic: e2e-deterministic-waits
tags: [e2e, puppeteer, async, flake]
applies_to: any-fullstack-kata
---

# Seed — Wait for selectors, not for time

Puppeteer's `page.goto()` resolves when the navigation completes, but DOM
elements may still be hydrating after that. Asserting against a selector
that hasn't rendered yet produces a flake — the test fails on the first run
and passes on the next, with no code change.

## The right pattern

```ts
await page.goto(BASE_URL);
await page.waitForSelector('[data-testid="todo-input"]');
const input = await page.$('[data-testid="todo-input"]');
expect(input).not.toBeNull();
```

Always `waitForSelector` before any assertion that depends on the DOM
being ready. After typing, before checking the rendered list, after a
click that triggers a re-render — wait first.

## What NOT to do

```ts
// WRONG — flake-prone
await page.goto(BASE_URL);
await page.waitForTimeout(500);  // arbitrary, may be too short
const input = await page.$('[data-testid="todo-input"]');
expect(input).not.toBeNull();
```

`waitForTimeout` (or `setTimeout`) trades flake-frequency for slowness and
is not deterministic on a busy machine. Use it only when you literally
cannot bind a wait to a DOM event.

## After interactions

```ts
await page.type('[data-testid="todo-input"]', "buy milk");
await page.click('[data-testid="add-button"]');
await page.waitForSelector('[data-testid="todo-item-0"]');  // wait for the new item to render
```

## Why this seed exists

E2E flakes are the single most expensive failure mode in a test suite —
they erode trust in the signal. A passing test that fails 1 time in 5 is
worse than a deterministically failing test, because the deterministic one
gets fixed and the flake gets retried until it cooperates. Make every
assertion ground out on a wait.
