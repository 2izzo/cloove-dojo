import puppeteer, { Browser, Page } from "puppeteer";
import { Contract, ContractElement } from "./contract.js";

/**
 * Compliance Checker — validates that a running app meets its contract
 * Uses Puppeteer to inspect DOM and verify semantic structure + elements
 */

export interface ComplianceResult {
  success: boolean;
  score: number; // 0-100
  totalElements: number;
  foundElements: number;
  missingElements: string[];
  typeErrors: Array<{
    testid: string;
    expected: string;
    actual: string;
  }>;
  errors: string[];
}

/**
 * Check if a running app complies with its contract
 *
 * Launches Puppeteer, navigates to the app, and verifies:
 * 1. All semantic_requirements (header, main, footer, form, etc.)
 * 2. All elements with data-testid exist
 * 3. Element tag types match contract (e.g., contract says button, DOM has button)
 *
 * @param url - Base URL of the app (e.g., "http://localhost:5173")
 * @param contract - Contract object to validate against
 * @returns Promise<ComplianceResult> with score, missing elements, and errors
 */
export async function checkCompliance(
  url: string,
  contract: Contract
): Promise<ComplianceResult> {
  const result: ComplianceResult = {
    success: false,
    score: 0,
    totalElements: contract.elements.length,
    foundElements: 0,
    missingElements: [],
    typeErrors: [],
    errors: [],
  };

  let browser: Browser | null = null;

  try {
    // Launch Puppeteer with headless flags
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to the app
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    } catch (e) {
      result.errors.push(`Failed to navigate to ${url}: ${String(e)}`);
      result.success = false;
      return result;
    }

    // --- Check Semantic Requirements ---
    for (const req of contract.semantic_requirements) {
      const element = await page.$(req.element);
      if (!element) {
        result.errors.push(
          `Semantic requirement missing: <${req.element}> (${req.description})`
        );
      }
    }

    // --- Check Contract Elements ---
    for (const elem of contract.elements) {
      const selector = `[data-testid="${elem.testid}"]`;
      const domElement = await page.$(selector);

      if (!domElement) {
        result.missingElements.push(elem.testid);
      } else {
        result.foundElements++;

        // Verify element type matches contract
        if (elem.element) {
          const actualTag = await page.evaluate(
            (sel) => document.querySelector(sel)?.tagName.toLowerCase(),
            selector
          );

          if (actualTag && actualTag !== elem.element.toLowerCase()) {
            result.typeErrors.push({
              testid: elem.testid,
              expected: elem.element,
              actual: actualTag,
            });
          }
        }

        // Check input type if specified
        if (elem.type && elem.element === "input") {
          const actualType = await page.evaluate(
            (sel) => document.querySelector(sel)?.getAttribute("type"),
            selector
          );
          if (actualType && actualType !== elem.type) {
            result.typeErrors.push({
              testid: elem.testid,
              expected: `input[type="${elem.type}"]`,
              actual: `input[type="${actualType}"]`,
            });
          }
        }
      }
    }

    // Calculate score
    // Start at 100, deduct for:
    // - Each missing element: -5 points
    // - Each type error: -3 points
    // - Each semantic requirement failure: -2 points
    const maxDeductions =
      result.missingElements.length * 5 +
      result.typeErrors.length * 3 +
      (contract.semantic_requirements.length -
        (contract.semantic_requirements.length -
          result.errors.filter((e) => e.includes("Semantic")).length)) *
        2;

    result.score = Math.max(0, 100 - maxDeductions);
    result.success =
      result.missingElements.length === 0 &&
      result.typeErrors.length === 0 &&
      result.errors.length === 0;

    await page.close();
  } catch (error) {
    result.errors.push(`Compliance check failed: ${String(error)}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return result;
}

/**
 * Format a ComplianceResult for human-readable output
 * @param result - ComplianceResult from checkCompliance()
 * @returns Formatted string report
 */
export function formatComplianceResult(result: ComplianceResult): string {
  const lines: string[] = [
    "=== Compliance Check Report ===",
    `Overall Score: ${result.score}/100`,
    `Elements Found: ${result.foundElements}/${result.totalElements}`,
  ];

  if (result.missingElements.length > 0) {
    lines.push(`\nMissing Elements (${result.missingElements.length}):`);
    result.missingElements.forEach((testid) => {
      lines.push(`  - ${testid}`);
    });
  }

  if (result.typeErrors.length > 0) {
    lines.push(`\nType Errors (${result.typeErrors.length}):`);
    result.typeErrors.forEach((err) => {
      lines.push(
        `  - ${err.testid}: expected <${err.expected}>, got <${err.actual}>`
      );
    });
  }

  if (result.errors.length > 0) {
    lines.push(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((err) => {
      lines.push(`  - ${err}`);
    });
  }

  lines.push(`\nStatus: ${result.success ? "PASS" : "FAIL"}`);

  return lines.join("\n");
}
