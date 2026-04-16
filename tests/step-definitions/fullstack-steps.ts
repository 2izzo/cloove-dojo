/**
 * Step definitions for fullstack dashboard features.
 *
 * These describe the TARGET behavior — the dashboard does not yet render
 * fullstack results with per-phase breakdown. Until the UI is updated, these
 * steps should fail with clear messages that explain what's missing.
 *
 * As we implement each UI piece, the corresponding step will go green.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { DojoWorld } from "../support/world";

// ── Fixtures ───────────────────────────────────────────────────────────

/**
 * Ensure a fullstack-shaped result exists in results/ so the dashboard
 * has something to render. Writes a fixture file if none is present.
 */
Given(
  "a fullstack result exists for kata {string}",
  async function (this: DojoWorld, kataName: string) {
    const today = new Date().toISOString().split("T")[0];
    const resultsDir = join(
      process.cwd(),
      "results",
      today,
      kataName,
      "fullstack-dev-v1"
    );
    mkdirSync(resultsDir, { recursive: true });

    const runFile = join(resultsDir, "run-01.json");
    if (!existsSync(runFile)) {
      const fixture = {
        kata: kataName,
        type: "fullstack",
        prompt: "fullstack-dev-v1",
        model: "devstral:24b-small-2505-q4_K_M",
        success: false,
        duration: 124500,
        phases: {
          scaffold: { success: true, message: "Scaffolded in 3.2s" },
          dev: { success: true, message: "Dev Cloove completed in 48s" },
          compliance: { success: true, score: 87, message: "Compliance: 87/100" },
          sdet: { success: true, message: "SDET Cloove completed in 55s" },
          tests_e2e: { success: false, message: "2/5 E2E tests passing" },
          tests_unit: { success: true, message: "All unit tests passing" },
        },
        timestamp: new Date().toISOString(),
      };
      writeFileSync(runFile, JSON.stringify(fixture, null, 2));
    }
  }
);

Given(
  "the fullstack result for {string} has a failed {string} phase",
  function (this: DojoWorld, _kata: string, _phase: string) {
    // Fixture above already has tests_e2e failing. This step is a
    // readability marker for the scenario — no additional setup needed
    // for our current fixture. When UI is ready, this may need to
    // rewrite the fixture to fail a specific phase.
  }
);

// ── UI expectations (currently red) ────────────────────────────────────

Then(
  "the kata dropdown marks {string} as a fullstack kata",
  async function (this: DojoWorld, kataName: string) {
    const label = await this.page!.evaluate((name: string) => {
      const sel = document.getElementById("kataSelect") as HTMLSelectElement;
      for (const opt of Array.from(sel.options)) {
        if (opt.value === name) return opt.textContent || "";
      }
      return "";
    }, kataName);
    assert.ok(
      label.toLowerCase().includes("fullstack"),
      `Dropdown option for "${kataName}" does not mark it as fullstack. ` +
        `Got: "${label}". UI TODO: distinguish fullstack katas in the dropdown.`
    );
  }
);

Then(
  "the results row for {string} shows an indicator for {string}",
  async function (this: DojoWorld, kataName: string, phase: string) {
    const found = await this.page!.evaluate(
      (k: string, p: string) => {
        const rows = Array.from(document.querySelectorAll("tr"));
        for (const row of rows) {
          const text = row.textContent || "";
          if (text.includes(k)) {
            const phaseEl = row.querySelector(`[data-phase="${p}"]`);
            if (phaseEl) return true;
          }
        }
        return false;
      },
      kataName,
      phase
    );
    assert.ok(
      found,
      `No [data-phase="${phase}"] indicator found in row for "${kataName}". ` +
        `UI TODO: add phase indicators to fullstack result rows.`
    );
  }
);

Then(
  "the results row for {string} shows a compliance score",
  async function (this: DojoWorld, kataName: string) {
    const found = await this.page!.evaluate((k: string) => {
      const rows = Array.from(document.querySelectorAll("tr"));
      for (const row of rows) {
        if ((row.textContent || "").includes(k)) {
          return !!row.querySelector("[data-phase='compliance']");
        }
      }
      return false;
    }, kataName);
    assert.ok(
      found,
      `No compliance score shown for "${kataName}". ` +
        `UI TODO: render compliance as a percentage in the result row.`
    );
  }
);

Then("the compliance score is formatted as a percentage", async function (
  this: DojoWorld
) {
  const text = await this.page!.$eval(
    "[data-phase='compliance']",
    (el) => el.textContent?.trim() || ""
  ).catch(() => "");
  assert.match(
    text,
    /\d+%/,
    `Compliance score "${text}" not formatted as a percentage. ` +
      `UI TODO: format compliance scores like "87%".`
  );
});

Then("the {string} indicator is styled to indicate failure", async function (
  this: DojoWorld,
  phase: string
) {
  const hasFailStyle = await this.page!.evaluate((p: string) => {
    const el = document.querySelector(`[data-phase="${p}"]`);
    if (!el) return false;
    const cls = el.className || "";
    return cls.includes("fail") || cls.includes("error") || cls.includes("red");
  }, phase);
  assert.ok(
    hasFailStyle,
    `Phase "${phase}" indicator has no failure styling. ` +
      `UI TODO: add a .fail modifier class when a phase fails.`
  );
});

Then("a tooltip or detail explains why the phase failed", async function (
  this: DojoWorld
) {
  const hasDetail = await this.page!.evaluate(() => {
    const fails = document.querySelectorAll("[data-phase].fail, [data-phase][title]");
    return fails.length > 0;
  });
  assert.ok(
    hasDetail,
    "No tooltip or failure detail found on the failed phase. " +
      "UI TODO: expose phase.message as a title= attribute or expandable row."
  );
});

// ── Live run expectations (currently red) ──────────────────────────────

When("I select kata {string}", async function (
  this: DojoWorld,
  kataName: string
) {
  await this.page!.select("#kataSelect", kataName);
});

When("I select prompt {string}", async function (
  this: DojoWorld,
  promptName: string
) {
  await this.page!.select("#promptSelect", promptName);
});

When("I click {string}", async function (this: DojoWorld, buttonText: string) {
  await this.page!.evaluate((text: string) => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => (b.textContent || "").trim().toUpperCase() === text.toUpperCase()
    );
    if (btn) (btn as HTMLButtonElement).click();
  }, buttonText);
});

Then("the run panel shows a phase progress section", async function (
  this: DojoWorld
) {
  // Give the UI a moment to react
  await new Promise((r) => setTimeout(r, 500));
  const found = await this.page!.$("#runPanel [data-phases]");
  assert.ok(
    found,
    "No phase progress section (#runPanel [data-phases]) found. " +
      "UI TODO: add per-phase progress rendering when a fullstack kata fires."
  );
});

Then(
  "each phase appears with a pending state before running",
  async function (this: DojoWorld) {
    const pendingCount = await this.page!.$$eval(
      "[data-phase][data-state='pending']",
      (els) => els.length
    );
    assert.ok(
      pendingCount >= 6,
      `Expected at least 6 pending phases, got ${pendingCount}. ` +
        `UI TODO: initialize all fullstack phases as pending on fire.`
    );
  }
);

Then(
  "each phase transitions to pass or fail when complete",
  async function (this: DojoWorld) {
    // This would poll the run until it completes. For now, mark as a
    // placeholder — we'll flesh this out once the UI exists to watch.
    assert.fail(
      "Phase-transition behavior not yet implemented. " +
        "UI TODO: poll run status and update each phase state inline."
    );
  }
);
