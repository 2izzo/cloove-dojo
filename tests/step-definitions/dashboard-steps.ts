/**
 * Step definitions for dashboard baseline features.
 *
 * These use Puppeteer to drive the real dashboard page. Each step should be
 * small, readable, and match natural Gherkin language.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { DojoWorld } from "../support/world";

// ── Given ──────────────────────────────────────────────────────────────

Given("the Dojo dashboard is running", async function (this: DojoWorld) {
  // Sanity-check the health endpoint before opening the page
  const res = await fetch(`${this.baseUrl}/api/status`);
  assert.equal(res.status, 200, "Dashboard /api/status did not return 200");
});

Given(
  "I have opened the dashboard in a browser",
  async function (this: DojoWorld) {
    await this.openDashboard();
    await this.waitForDashboardReady();
  }
);

Given(
  "at least one result exists in the results directory",
  async function (this: DojoWorld) {
    const resultsDir = join(process.cwd(), "results");
    assert.ok(existsSync(resultsDir), "results/ directory missing");
    const dates = readdirSync(resultsDir).filter((d) =>
      /^\d{4}-\d{2}-\d{2}$/.test(d)
    );
    assert.ok(dates.length > 0, "No dated result directories found");
  }
);

// ── When ───────────────────────────────────────────────────────────────

When("the dashboard finishes loading", async function (this: DojoWorld) {
  await this.waitForDashboardReady();
});

// ── Then ───────────────────────────────────────────────────────────────

Then("I see the title {string}", async function (
  this: DojoWorld,
  expected: string
) {
  const h1 = await this.page!.$eval("h1", (el) => el.textContent?.trim() || "");
  // Header is "CLOOVE DOJO" with CLOOVE in the accent span
  assert.ok(
    h1.replace(/\s+/g, " ").includes(expected),
    `Expected title to include "${expected}", got "${h1}"`
  );
});

Then("the health indicator shows a version number", async function (
  this: DojoWorld
) {
  const healthText = await this.page!.$eval(
    "#healthText",
    (el) => el.textContent?.trim() || ""
  );
  assert.match(
    healthText,
    /^v\d+\.\d+/,
    `Expected version string (v0.1.0), got "${healthText}"`
  );
});

Then("the kata count is shown", async function (this: DojoWorld) {
  const countText = await this.page!.$eval(
    "#kataCount",
    (el) => el.textContent?.trim() || ""
  );
  assert.match(
    countText,
    /\d+ katas/,
    `Expected "N katas", got "${countText}"`
  );
});

Then("I see a section titled {string}", async function (
  this: DojoWorld,
  title: string
) {
  const headings = await this.page!.$$eval(
    "h1, h2, h3",
    (els) => els.map((e) => e.textContent?.trim() || "")
  );
  const matched = headings.some((h) =>
    h.toLowerCase().includes(title.toLowerCase())
  );
  assert.ok(
    matched,
    `No heading contained "${title}". Headings found: ${JSON.stringify(headings)}`
  );
});

Then("I see a {string} dropdown", async function (
  this: DojoWorld,
  label: string
) {
  // Find a <label> with this text, then confirm its sibling is a <select>
  const found = await this.page!.evaluate((wanted: string) => {
    const labels = Array.from(document.querySelectorAll("label"));
    for (const lbl of labels) {
      if ((lbl.textContent || "").trim().toLowerCase() === wanted.toLowerCase()) {
        const group = lbl.parentElement;
        if (group && group.querySelector("select")) return true;
      }
    }
    return false;
  }, label);
  assert.ok(found, `No dropdown labeled "${label}" found`);
});

Then("I see a button labeled {string}", async function (
  this: DojoWorld,
  label: string
) {
  const buttons = await this.page!.$$eval("button", (els) =>
    els.map((e) => e.textContent?.trim() || "")
  );
  const matched = buttons.some((b) =>
    b.toLowerCase().includes(label.toLowerCase())
  );
  assert.ok(
    matched,
    `No button labeled "${label}" found. Buttons: ${JSON.stringify(buttons)}`
  );
});

Then("the kata dropdown has at least {int} options", async function (
  this: DojoWorld,
  min: number
) {
  const count = await this.page!.$eval(
    "#kataSelect",
    (el) => (el as HTMLSelectElement).options.length
  );
  assert.ok(
    count >= min,
    `Expected >= ${min} kata options, got ${count}`
  );
});

Then("the prompt dropdown includes {string}", async function (
  this: DojoWorld,
  promptName: string
) {
  const options = await this.page!.$$eval(
    "#promptSelect option",
    (els) => els.map((e) => (e as HTMLOptionElement).value)
  );
  assert.ok(
    options.includes(promptName),
    `Prompt "${promptName}" not in dropdown. Found: ${JSON.stringify(options)}`
  );
});

Then("the ring dropdown has exactly {int} options", async function (
  this: DojoWorld,
  expected: number
) {
  const count = await this.page!.$eval(
    "#ringSelect",
    (el) => (el as HTMLSelectElement).options.length
  );
  assert.equal(count, expected, `Expected ${expected} ring options, got ${count}`);
});

Then("the ring dropdown includes {string}", async function (
  this: DojoWorld,
  text: string
) {
  const labels = await this.page!.$$eval(
    "#ringSelect option",
    (els) => els.map((e) => e.textContent?.trim() || "")
  );
  const matched = labels.some((l) => l.includes(text));
  assert.ok(
    matched,
    `Ring option "${text}" not found. Options: ${JSON.stringify(labels)}`
  );
});

Then("I see at least one results table", async function (this: DojoWorld) {
  const tableCount = await this.page!.$$eval(
    ".results-table",
    (els) => els.length
  );
  assert.ok(
    tableCount >= 1,
    `Expected at least 1 results table, got ${tableCount}`
  );
});
