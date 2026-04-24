/**
 * Direct-Ollama harness for Ring 1 (replaces Cline CLI).
 *
 * Why: Cline was giving us an agent loop, its own system prompt, and an XML
 * tool-use schema we were fighting. Ring 1 is single-shot — description +
 * architecture + tests in, complete file content out. We don't need any of
 * Cline's machinery. This adapter:
 *
 *   1. Sends the rendered prompt to Ollama's /api/chat with OUR system prompt
 *      that specifies the output schema (===FILE: path===\n...\n===END===).
 *   2. Parses the response for file blocks (see parse-files.ts).
 *   3. Writes the files directly to `workdir`.
 *   4. Returns a RunResult shaped like the old fireCline() return for drop-in
 *      compatibility with run-kata.ts / run-fullstack.ts.
 *
 * Ring 1 single-shot, no agent loop. If we need iteration at higher rings
 * we'll build it explicitly, not inherit it from a vendored tool.
 */

import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve, join } from "path";
import YAML from "yaml";
import { parseFiles } from "./parse-files";

const CONFIG_PATH = resolve(import.meta.dir, "../config.yaml");

interface OllamaConfig {
  base_url: string;
  default_model: string;
  /** num_predict cap for the model — keep generous so full files fit. */
  num_predict?: number;
  /** Sampling temperature — low for deterministic Ring 1 code. */
  temperature?: number;
}

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  elapsedSeconds: number;
  timedOut: boolean;
}

export interface FireOllamaOptions {
  /**
   * Single-file fallback hint. If the model doesn't emit ===FILE: markers
   * but the kata expects a single file, use this name for fallback parse.
   */
  expectedSingleFile?: string;
}

function loadConfig(): OllamaConfig {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const cfg = YAML.parse(raw);
  if (!cfg?.ollama?.base_url) {
    throw new Error("config.yaml: ollama.base_url is required");
  }
  if (!cfg?.ollama?.default_model) {
    throw new Error("config.yaml: ollama.default_model is required");
  }
  return cfg.ollama;
}

const SYSTEM_PROMPT = `You are implementing a coding kata. Output every file you create or modify using this EXACT format — one block per file:

===FILE: <relative/path/from/workspace-root>===
<complete file content — no code fences, no prose, no commentary>
===END===

Rules:
- Output ALL files the task requires, each in its own ===FILE:/===END=== block.
- Use relative paths only (no leading slash, no "..", no Windows drive letters).
- Inside a block: raw file content only — no markdown fences, no backticks, no prose.
- Prose is allowed BEFORE the first block or AFTER the last block, never between markers.
- End your entire response with a single final line: **STATUS:** DONE`;

export async function fireOllama(
  prompt: string,
  workdir: string,
  timeoutMinutes: number = 15,
  model?: string,
  options: FireOllamaOptions = {}
): Promise<RunResult> {
  const config = loadConfig();
  const targetModel = model ?? config.default_model;
  const baseUrl = config.base_url.replace(/\/+$/, "");
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const startTime = Date.now();
  let timedOut = false;
  let stdout = "";
  let stderr = "";

  const controller = new AbortController();
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const elapsed = () => (Date.now() - startTime) / 1000;

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: targetModel,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        options: {
          temperature: config.temperature ?? 0.2,
          num_predict: config.num_predict ?? 8192,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timer);
      const body = await response.text().catch(() => "<no body>");
      return {
        exitCode: 1,
        stdout: "",
        stderr: `Ollama HTTP ${response.status}: ${body}`,
        elapsedSeconds: elapsed(),
        timedOut: false,
      };
    }

    const parsed = (await response.json()) as {
      message?: { content?: string };
    };
    stdout = parsed.message?.content ?? "";
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      exitCode: 1,
      stdout,
      stderr: timedOut
        ? `Timed out after ${timeoutMinutes}m waiting for Ollama`
        : `Ollama request failed: ${msg}`,
      elapsedSeconds: elapsed(),
      timedOut,
    };
  }
  clearTimeout(timer);

  // Parse files out of the response and write them to the workspace.
  const extraction = parseFiles(stdout, {
    expectedSingleFile: options.expectedSingleFile,
  });

  let exitCode = 0;

  if (extraction.files.length === 0) {
    stderr +=
      "No files extracted from model response. " +
      (extraction.warnings.join("; ") || "(no warnings)") +
      "\n";
    exitCode = 1;
  } else {
    for (const f of extraction.files) {
      try {
        const outPath = join(workdir, f.path);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, f.content);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        stderr += `Failed to write ${f.path}: ${msg}\n`;
        exitCode = 1;
      }
    }
    if (extraction.warnings.length > 0) {
      stderr += `Parser warnings: ${extraction.warnings.join("; ")}\n`;
    }
  }

  return {
    exitCode,
    stdout,
    stderr,
    elapsedSeconds: elapsed(),
    timedOut,
  };
}
