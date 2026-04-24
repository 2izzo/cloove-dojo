/**
 * fullstack-todo-app — Blind Ring 1 E2E oracle.
 *
 * These tests are derived SOLELY from the kata's contract.yaml. They are
 * written before any dev implementation exists and are shipped with the
 * kata so each dev run is scored against the same oracle.
 *
 * The kata runner starts the dev server on port 5173 before invoking
 * vitest. This file does NOT spawn npm run dev — it only drives the
 * already-running server.
 */
import puppeteer, { Browser, Page } from "puppeteer";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

const BASE_URL = process.env.DOJO_BASE_URL || "http://localhost:5173";
const ASSERT_TIMEOUT = 10_000;

// ---------- Helpers --------------------------------------------------------

async function waitForApp(page: Page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle0", timeout: 30_000 });
  await page.waitForSelector("[data-testid='todo-input']", {
    visible: true,
    timeout: ASSERT_TIMEOUT,
  });
}

async function typeInto(page: Page, selector: string, text: string) {
  await page.waitForSelector(selector, { visible: true, timeout: ASSERT_TIMEOUT });
  // Clear then type — `page.type` appends, so clear first.
  await page.$eval(selector, (el) => {
    const input = el as HTMLInputElement;
    input.value = "";
  });
  await page.type(selector, text);
}

async function clickOn(page: Page, selector: string) {
  await page.waitForSelector(selector, { visible: true, timeout: ASSERT_TIMEOUT });
  await page.click(selector);
}

async function getText(page: Page, selector: string): Promise<string> {
  await page.waitForSelector(selector, { timeout: ASSERT_TIMEOUT });
  return page.$eval(selector, (el) => (el.textContent || "").trim());
}

async function getValue(page: Page, selector: string): Promise<string> {
  return page.$eval(selector, (el) => (el as HTMLInputElement).value);
}

async function countMatching(page: Page, selector: string): Promise<number> {
  return page.$$eval(selector, (els) => els.length);
}

async function hasClass(page: Page, selector: string, cls: string): Promise<boolean> {
  return page.$eval(
    selector,
    (el, c) => el.classList.contains(c as string),
    cls,
  );
}

async function isHiddenOrAbsent(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return true;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return true;
    const rect = el.getBoundingClientRect();
    return rect.width === 0 && rect.height === 0;
  }, selector);
}

async function elementTag(page: Page, selector: string): Promise<string> {
  return page.$eval(selector, (el) => el.tagName.toLowerCase());
}

async function elementAttr(
  page: Page,
  selector: string,
  attr: string,
): Promise<string | null> {
  return page.$eval(
    selector,
    (el, a) => el.getAttribute(a as string),
    attr,
  );
}

async function settle(page: Page, ms = 100) {
  await new Promise((r) => setTimeout(r, ms));
}

// ---------- Fixture --------------------------------------------------------

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });
});

afterAll(async () => {
  if (browser) await browser.close();
});

beforeEach(async () => {
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.setDefaultTimeout(ASSERT_TIMEOUT);
  await waitForApp(page);
});

// ---------- Section A — Semantic structure --------------------------------

describe("Section A — Semantic structure", () => {
  it("has a <header>", async () => {
    expect(await page.$("header")).not.toBeNull();
  });

  it("has a <main>", async () => {
    expect(await page.$("main")).not.toBeNull();
  });

  it("has a <footer>", async () => {
    expect(await page.$("footer")).not.toBeNull();
  });

  it("has a <form>", async () => {
    expect(await page.$("form")).not.toBeNull();
  });
});

// ---------- Section B — Testable elements (contract compliance) -----------

describe("Section B — Testable elements", () => {
  it("app-title is an <h1> inside <header>", async () => {
    const sel = "[data-testid='app-title']";
    expect(await elementTag(page, sel)).toBe("h1");
    const inHeader = await page.$eval(sel, (el) => !!el.closest("header"));
    expect(inHeader).toBe(true);
  });

  it("todo-input is a text <input> with the contract placeholder", async () => {
    const sel = "[data-testid='todo-input']";
    expect(await elementTag(page, sel)).toBe("input");
    const type = await elementAttr(page, sel, "type");
    expect(type === null || type === "text").toBe(true);
    expect(await elementAttr(page, sel, "placeholder")).toBe(
      "What needs to be done?",
    );
  });

  it("todo-submit is a <button>, visible and enabled", async () => {
    const sel = "[data-testid='todo-submit']";
    expect(await elementTag(page, sel)).toBe("button");
    const disabled = await page.$eval(
      sel,
      (el) => (el as HTMLButtonElement).disabled,
    );
    expect(disabled).toBe(false);
  });

  it("todo-list is a <ul> inside <main>", async () => {
    const sel = "[data-testid='todo-list']";
    expect(await elementTag(page, sel)).toBe("ul");
    const inMain = await page.$eval(sel, (el) => !!el.closest("main"));
    expect(inMain).toBe(true);
  });

  it("active-count is a <span> inside <footer>", async () => {
    const sel = "[data-testid='active-count']";
    expect(await elementTag(page, sel)).toBe("span");
    const inFooter = await page.$eval(sel, (el) => !!el.closest("footer"));
    expect(inFooter).toBe(true);
  });

  it("clear-completed is hidden or absent when there are no completed todos", async () => {
    expect(await isHiddenOrAbsent(page, "[data-testid='clear-completed']")).toBe(
      true,
    );
  });

  it("child item testid pattern populates after adding a todo", async () => {
    await typeInto(page, "[data-testid='todo-input']", "Sample");
    await clickOn(page, "[data-testid='todo-submit']");
    await page.waitForSelector("[data-testid='todo-item-0']", {
      timeout: ASSERT_TIMEOUT,
    });

    expect(await elementTag(page, "[data-testid='todo-item-0']")).toBe("li");
    expect(
      await elementTag(page, "[data-testid='todo-item-0'] [data-testid='item-text']"),
    ).toBe("span");
    expect(
      await elementTag(page, "[data-testid='todo-item-0'] [data-testid='item-toggle']"),
    ).toBe("input");
    const toggleType = await elementAttr(
      page,
      "[data-testid='todo-item-0'] [data-testid='item-toggle']",
      "type",
    );
    expect(toggleType).toBe("checkbox");
    expect(
      await elementTag(
        page,
        "[data-testid='todo-item-0'] [data-testid='item-delete']",
      ),
    ).toBe("button");
  });
});

// ---------- Section C — User flows ----------------------------------------

describe("Section C — User flows", () => {
  it("add-todo: adding via submit populates list, clears input, updates count", async () => {
    await typeInto(page, "[data-testid='todo-input']", "Buy milk");
    await clickOn(page, "[data-testid='todo-submit']");

    await page.waitForSelector("[data-testid='todo-item-0']", {
      timeout: ASSERT_TIMEOUT,
    });
    expect(
      await getText(page, "[data-testid='todo-item-0'] [data-testid='item-text']"),
    ).toContain("Buy milk");
    expect(await getValue(page, "[data-testid='todo-input']")).toBe("");
    expect(await getText(page, "[data-testid='active-count']")).toContain("1");
  });

  it("add-multiple-todos: three adds produce three items and count=3", async () => {
    for (const t of ["First todo", "Second todo", "Third todo"]) {
      await typeInto(page, "[data-testid='todo-input']", t);
      await clickOn(page, "[data-testid='todo-submit']");
      await settle(page);
    }
    expect(await countMatching(page, "[data-testid='todo-list'] li")).toBe(3);
    expect(await getText(page, "[data-testid='active-count']")).toContain("3");
  });

  it("reject-empty-submission: clicking submit with empty input adds nothing", async () => {
    await clickOn(page, "[data-testid='todo-submit']");
    await settle(page);
    expect(await countMatching(page, "[data-testid='todo-list'] li")).toBe(0);
  });

  it("complete-todo: toggling marks item completed and decrements active count", async () => {
    await typeInto(page, "[data-testid='todo-input']", "Completable item");
    await clickOn(page, "[data-testid='todo-submit']");
    await page.waitForSelector("[data-testid='todo-item-0']");
    await clickOn(
      page,
      "[data-testid='todo-item-0'] [data-testid='item-toggle']",
    );
    await settle(page);

    expect(await hasClass(page, "[data-testid='todo-item-0']", "completed")).toBe(
      true,
    );
    expect(await getText(page, "[data-testid='active-count']")).toContain("0");
  });

  it("uncomplete-todo: untoggling removes completed state and re-increments count", async () => {
    await typeInto(page, "[data-testid='todo-input']", "Toggle me");
    await clickOn(page, "[data-testid='todo-submit']");
    await page.waitForSelector("[data-testid='todo-item-0']");
    await clickOn(
      page,
      "[data-testid='todo-item-0'] [data-testid='item-toggle']",
    );
    await settle(page);
    await clickOn(
      page,
      "[data-testid='todo-item-0'] [data-testid='item-toggle']",
    );
    await settle(page);

    expect(await hasClass(page, "[data-testid='todo-item-0']", "completed")).toBe(
      false,
    );
    expect(await getText(page, "[data-testid='active-count']")).toContain("1");
  });

  it("delete-todo: delete removes the item and leaves the other", async () => {
    await typeInto(page, "[data-testid='todo-input']", "Delete me");
    await clickOn(page, "[data-testid='todo-submit']");
    await settle(page);
    await typeInto(page, "[data-testid='todo-input']", "Keep me");
    await clickOn(page, "[data-testid='todo-submit']");
    await settle(page);

    await clickOn(
      page,
      "[data-testid='todo-item-0'] [data-testid='item-delete']",
    );
    await settle(page);

    expect(await countMatching(page, "[data-testid='todo-list'] li")).toBe(1);
    expect(
      await getText(page, "[data-testid='todo-item-0'] [data-testid='item-text']"),
    ).toContain("Keep me");
    expect(await getText(page, "[data-testid='active-count']")).toContain("1");
  });

  it("clear-completed: removes completed items and hides the clear button afterward", async () => {
    await typeInto(page, "[data-testid='todo-input']", "Active item");
    await clickOn(page, "[data-testid='todo-submit']");
    await settle(page);
    await typeInto(page, "[data-testid='todo-input']", "Complete me");
    await clickOn(page, "[data-testid='todo-submit']");
    await settle(page);
    await clickOn(
      page,
      "[data-testid='todo-item-1'] [data-testid='item-toggle']",
    );
    await settle(page);

    // Button should be visible while at least one completed todo exists.
    await page.waitForSelector("[data-testid='clear-completed']", {
      visible: true,
      timeout: ASSERT_TIMEOUT,
    });
    await clickOn(page, "[data-testid='clear-completed']");
    await settle(page);

    expect(await countMatching(page, "[data-testid='todo-list'] li")).toBe(1);
    expect(
      await getText(page, "[data-testid='todo-item-0'] [data-testid='item-text']"),
    ).toContain("Active item");
    expect(
      await isHiddenOrAbsent(page, "[data-testid='clear-completed']"),
    ).toBe(true);
  });
});
