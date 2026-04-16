/**
 * Cucumber hooks — browser lifecycle.
 * One browser per scenario for isolation; fast enough with headless mode.
 */

import { Before, After } from "@cucumber/cucumber";
import puppeteer from "puppeteer";
import { DojoWorld } from "./world";

Before(async function (this: DojoWorld) {
  this.browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  this.page = await this.browser.newPage();
  await this.page.setViewport({ width: 1280, height: 800 });
});

After(async function (this: DojoWorld) {
  if (this.page) await this.page.close();
  if (this.browser) await this.browser.close();
});
