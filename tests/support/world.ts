/**
 * Cucumber World — per-scenario state.
 *
 * Each scenario gets a fresh DojoWorld instance. Puppeteer browser and page
 * are created in the Before hook, torn down in After.
 */

import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import type { Browser, Page } from "puppeteer";

export interface DojoWorldParameters {
  baseUrl?: string;
}

export class DojoWorld extends World<DojoWorldParameters> {
  browser?: Browser;
  page?: Page;
  baseUrl: string;

  constructor(options: IWorldOptions<DojoWorldParameters>) {
    super(options);
    this.baseUrl = options.parameters?.baseUrl || "http://localhost:20158";
  }

  async openDashboard(): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");
    await this.page.goto(this.baseUrl, { waitUntil: "networkidle0" });
  }

  async waitForDashboardReady(): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");
    // Wait for the init() JS to finish — kata dropdown populated
    await this.page.waitForFunction(
      () => {
        const sel = document.getElementById("kataSelect") as HTMLSelectElement | null;
        return sel && sel.options.length > 0;
      },
      { timeout: 10000 }
    );
  }
}

setWorldConstructor(DojoWorld);
