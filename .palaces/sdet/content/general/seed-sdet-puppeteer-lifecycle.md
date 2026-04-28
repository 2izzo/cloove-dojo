---
type: seed
cloove: sdet
topic: e2e-puppeteer-lifecycle
tags: [e2e, puppeteer, beforeAll, afterAll, cleanup]
applies_to: any-fullstack-kata
---

# Seed — Always launch in beforeAll, close in afterAll

Puppeteer launches a real Chrome process for every browser instance. If
the test file forgets to close the browser, the process lingers — eats
memory, holds the dev server port, and on a long sweep eventually pegs
the host.

## The right shape

```ts
import puppeteer, { Browser, Page } from "puppeteer";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

const BASE_URL = "http://localhost:5173";

describe("App E2E", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
  });

  afterAll(async () => {
    await browser.close();   // critical — releases the Chrome process
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(BASE_URL);
  });

  // tests...
});
```

## What can go wrong

- **Missing `afterAll`.** Each run leaks a Chrome process. After ~10 sweep
  runs the host is out of memory and subsequent runs fail at launch.
- **Launching per-test instead of per-suite.** Slow (each launch is ~1s)
  and amplifies leaks if cleanup is also missing.
- **Not awaiting `browser.close()`.** The process exits before close
  completes; same leak as missing it.

## Use a single page across tests, or one per test?

A single page kept across the suite is faster but couples tests by state
(form contents, history, scroll position). Prefer creating a fresh
`page` in `beforeEach` and closing it in `afterEach` — better isolation,
small overhead.

## Why this seed exists

Bug 24 from the 2026-04-23 session caught vitest's testTimeout being too
tight for E2E flows; the same long-running tests amplify any cleanup
miss. Lifecycle hygiene is the cheapest fix for a class of bugs that
otherwise look like "intermittent host slowness."
