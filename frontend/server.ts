#!/usr/bin/env bun
/**
 * Dojo Dashboard — Lightweight HTTP server for viewing kata results
 * Runs on port 20158, proxied via Caddy at :20058
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import YAML from "yaml";

const DOJO_ROOT = resolve(import.meta.dir, "..");
const config = YAML.parse(readFileSync(join(DOJO_ROOT, "dojo.yaml"), "utf-8"));
const PORT = config.server?.port || 20158;

function loadAllResults(): Record<string, Record<string, Record<string, any[]>>> {
  const resultsDir = join(DOJO_ROOT, "results");
  if (!existsSync(resultsDir)) return {};

  const data: Record<string, Record<string, Record<string, any[]>>> = {};

  for (const date of readdirSync(resultsDir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
    data[date] = {};
    const datePath = join(resultsDir, date);
    for (const kata of readdirSync(datePath)) {
      data[date][kata] = {};
      const kataPath = join(datePath, kata);
      for (const prompt of readdirSync(kataPath)) {
        const promptPath = join(kataPath, prompt);
        const runs = readdirSync(promptPath)
          .filter((f) => f.endsWith(".json"))
          .map((f) => JSON.parse(readFileSync(join(promptPath, f), "utf-8")));
        if (runs.length) data[date][kata][prompt] = runs;
      }
    }
  }
  return data;
}

function loadKatas(): Record<string, any> {
  const katasDir = join(DOJO_ROOT, "katas");
  const katas: Record<string, any> = {};
  for (const name of readdirSync(katasDir).filter((d) => !d.startsWith("_"))) {
    const yamlPath = join(katasDir, name, "kata.yaml");
    if (existsSync(yamlPath)) {
      katas[name] = YAML.parse(readFileSync(yamlPath, "utf-8"));
    }
  }
  return katas;
}

const HTML = readFileSync(join(import.meta.dir, "index.html"), "utf-8");

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, { headers: { "Content-Type": "text/html" } });
    }

    if (url.pathname === "/api/results") {
      return Response.json(loadAllResults());
    }

    if (url.pathname === "/api/katas") {
      return Response.json(loadKatas());
    }

    if (url.pathname === "/api/status") {
      return Response.json({
        version: config.version,
        models: config.models,
        katas: Object.keys(loadKatas()),
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Dojo Dashboard running on http://0.0.0.0:${PORT}`);
