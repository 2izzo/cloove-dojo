// runner/wake-up.ts
//
// Rung 2 — read-side wake-up hook for kata clooves.
//
// Before a cloove fires its first prompt for a kata, search the cloove's
// per-role mempalace for drawers relevant to (kata × ring × role) and format
// them as an Adlerian preamble that prepends to the rendered prompt.
//
// Adlerian shape: forward-looking, scoped, decision-relevant. We do NOT dump
// every win and scar the cloove ever filed — that's Freudian rumination at
// agent scale. We pull the top N matches against a focused query and let
// semantic search do the relevance work.
//
// What we surface:
//   • Hand-authored seeds in general/ (cross-kata craft notes)
//   • Scars from any kata (what didn't work; transferable craft)
//
// What we DON'T surface:
//   • Wins. They describe outcomes, not what to DO. They're also numerous
//     once a model is performing well, which would crowd out craft notes
//     by sheer volume in the search ranking.
//
// Implementation note: mempalace search returns the matching CHUNK of a
// drawer, not the whole file. We use the Source field to read the full
// drawer from disk so the preamble carries complete craft notes, not
// arbitrary text fragments.
//
// If the palace doesn't exist or returns nothing useful, this returns an
// empty string and the runner uses the rendered prompt unchanged. Stateless
// fallback — no error, just no preamble.

import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

import type { ClooveRole } from "./consolidator";

const MEMPALACE_BIN =
  process.env.MEMPALACE_BIN || "/home/squibs/.local/bin/mempalace";

export type KataType = "backend" | "fullstack";

export interface WakeUpOptions {
  /** How many top drawers to include in the preamble. Default 5. */
  topN?: number;
  /** Extra task keywords appended to the search query. Default []. */
  extraKeywords?: string[];
  /** Override the search pool size (mempalace --results). Default topN * 4. */
  searchPool?: number;
  /**
   * Which kata type the wake-up is being built for. When set, seeds whose
   * applies_to: frontmatter doesn't match are filtered out. When omitted,
   * all seeds are included (legacy behavior).
   */
  kataType?: KataType;
}

interface SearchHit {
  index: number;
  room: string;
  source: string;
  matchScore: number;
}

/**
 * Strip the YAML frontmatter from a drawer body. We keep the markdown content
 * because that's what's instructive. Frontmatter is metadata for indexing.
 */
function stripFrontmatter(body: string): string {
  const trimmed = body.trim();
  if (!trimmed.startsWith("---")) return trimmed;
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) return trimmed;
  return trimmed.slice(end + 4).trim();
}

/**
 * Parse the structured fields (index, room, source, match score) out of
 * mempalace search's text output. We only need the metadata; the displayed
 * body is a chunk and we read the full file separately.
 */
function parseSearchHits(out: string): SearchHit[] {
  const hits: SearchHit[] = [];
  const blocks = out.split(/\n\s*\[(\d+)\]\s+/);
  for (let i = 1; i < blocks.length; i += 2) {
    const idx = parseInt(blocks[i], 10);
    const block = blocks[i + 1] || "";
    const lines = block.split("\n");
    const room = (lines[0] || "").trim();
    const sourceLine = lines.find((l) => l.trim().startsWith("Source:")) || "";
    const matchLine = lines.find((l) => l.trim().startsWith("Match:")) || "";
    const source = sourceLine.replace(/.*Source:\s*/, "").trim();
    const matchScore = parseFloat(matchLine.replace(/.*Match:\s*/, "").trim()) || 0;
    if (source) hits.push({ index: idx, room, source, matchScore });
  }
  return hits;
}

/**
 * Find the on-disk path for a drawer given its Source basename and the room
 * label from the search output. Wins/scars live under <room>/<kata>/<basename>;
 * general/ drawers live directly under general/<basename>. We glob the role's
 * content tree to handle both layouts.
 */
function findDrawerPath(
  contentRoot: string,
  room: string,
  basename: string
): string | null {
  // Room is like "content / general", "content / wins", "content / scars".
  const roomName = room.split("/").pop()?.trim() || "";
  const roomDir = join(contentRoot, roomName);
  if (!existsSync(roomDir)) return null;

  // general/ → flat
  if (roomName === "general") {
    const direct = join(roomDir, basename);
    return existsSync(direct) ? direct : null;
  }

  // wins/scars → kata-subdir layout. Walk one level deep.
  for (const entry of readdirSync(roomDir)) {
    const sub = join(roomDir, entry);
    if (!statSync(sub).isDirectory()) continue;
    const candidate = join(sub, basename);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Run a mempalace search against a role's palace and return parsed hits.
 * Returns [] if the palace doesn't exist or the command errors — this hook
 * must never break a kata run.
 */
function searchPalace(
  dojoRoot: string,
  role: ClooveRole,
  query: string,
  pool: number
): SearchHit[] {
  const palacePath = join(dojoRoot, ".palaces", role, "storage");
  if (!existsSync(palacePath)) {
    return [];
  }
  try {
    const out = execSync(
      `${MEMPALACE_BIN} --palace "${palacePath}" search "${query.replace(/"/g, '\\"')}" --results ${pool}`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
    return parseSearchHits(out);
  } catch (e: any) {
    const msg = (e?.message ?? String(e)).split("\n")[0];
    console.warn(`  wake-up: palace search failed (continuing stateless): ${msg}`);
    return [];
  }
}

/**
 * Read the applies_to: frontmatter line from a seed file. Returns "" if the
 * file isn't a parseable seed or has no applies_to field — in which case
 * the seed is treated as "applies to both kata types."
 */
function readSeedAppliesTo(path: string): string {
  try {
    const head = readFileSync(path, "utf-8").slice(0, 1024);
    const match = head.match(/^applies_to:\s*(.+?)\s*$/m);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

/**
 * Decide whether a seed's applies_to: declaration matches the current kata
 * type. Logic is conservative: when in doubt, include. We only EXCLUDE a
 * seed when its applies_to clearly indicates the other kata type.
 *
 * Recognized fullstack-only tokens: contains "fullstack"
 * Recognized backend-only tokens:
 *   - contains "backend"
 *   - contains "throws-tests"     (TDD-style, backend pattern)
 *   - contains "tests-are-not-provided"  (backend Ring 2 shape)
 *
 * Everything else (all-katas, any-kata, any-kata-with-vitest, …) is
 * considered universal and matches both types.
 */
function seedMatchesKataType(appliesTo: string, kataType: KataType): boolean {
  if (!appliesTo) return true;
  const a = appliesTo.toLowerCase();
  const fullstackOnly = a.includes("fullstack");
  const backendOnly =
    a.includes("backend") ||
    a.includes("throws-tests") ||
    a.includes("tests-are-not-provided");

  if (fullstackOnly && !backendOnly) return kataType === "fullstack";
  if (backendOnly && !fullstackOnly) return kataType === "backend";
  return true;
}

/**
 * List all hand-authored seed drawers in a role's general/ room, optionally
 * filtered by kata type. Seeds are intentionally a small, curated set of
 * cross-kata craft notes — including them all is cheaper and more
 * predictable than ranking a population of <20 via semantic search.
 *
 * Filter rule: when kataType is set, drop seeds whose applies_to frontmatter
 * declares the other kata type. Universal seeds (no applies_to, or generic
 * tokens) always match.
 */
function listSeedDrawers(contentRoot: string, kataType?: KataType): string[] {
  const generalDir = join(contentRoot, "general");
  if (!existsSync(generalDir)) return [];
  const all = readdirSync(generalDir)
    .filter((f) => f.startsWith("seed-") && f.endsWith(".md"))
    .map((f) => join(generalDir, f))
    .sort(); // deterministic ordering across runs
  if (!kataType) return all;
  return all.filter((p) => seedMatchesKataType(readSeedAppliesTo(p), kataType));
}

/**
 * Build the Adlerian preamble for a kata run. Returns "" when nothing
 * relevant exists. The runner can unconditionally prepend whatever this
 * returns.
 *
 * Composition strategy:
 *   1. ALL hand-authored seeds in general/ (small curated set, always
 *      relevant cross-kata).
 *   2. TOP N kata-scoped scars from prior runs (semantic search filtered
 *      to scars/, ranked by match score). What didn't work last time on
 *      this exact kata × ring.
 *
 * Wins are excluded — they describe outcomes, not craft, and they grow
 * unboundedly which would crowd out actionable lessons.
 */
export function loadAdlerianPreamble(
  dojoRoot: string,
  role: ClooveRole,
  kata: string,
  ring: number,
  options: WakeUpOptions = {}
): string {
  const topN = options.topN ?? 5;
  const pool = options.searchPool ?? topN * 4;
  const extra = (options.extraKeywords ?? []).join(" ");

  const contentRoot = join(dojoRoot, ".palaces", role, "content");
  if (!existsSync(contentRoot)) return "";

  // 1. Always include every seed that applies to the current kata type.
  //    When kataType is unspecified, include all seeds (legacy callers).
  const seedPaths = listSeedDrawers(contentRoot, options.kataType);

  // 2. Scars (DISABLED in v1).
  //    The current scar drawer format records only "Filed because: all-tests-failed"
  //    plus the run JSON snapshot — no emitted-file list, no vitest stderr, no
  //    diagnostic signal. Including them in the preamble injects pessimism
  //    ("this kata always fails") with no actionable craft, which is the
  //    Freudian shape we're explicitly avoiding.
  //
  //    Re-enable once scar drawers carry real signal: model's emitted files,
  //    vitest output snippet, parser warnings. Tracked as a separate task.
  //
  // (Kept the search infrastructure in place — searchPalace, findDrawerPath,
  // dedupe — so re-enabling is a small change.)
  const scarPaths: string[] = [];
  // Unused for now; suppress lint by referencing.
  void pool; void extra;

  const allPaths = [...seedPaths, ...scarPaths];
  if (allPaths.length === 0) return "";

  const sections: string[] = [];
  for (const path of allPaths) {
    try {
      const raw = readFileSync(path, "utf-8");
      const body = stripFrontmatter(raw);
      if (body) sections.push(body);
    } catch {
      // Skip unreadable drawers silently — not worth failing the hook.
    }
  }
  if (sections.length === 0) return "";

  return [
    "# Things you've learned on similar katas before",
    "",
    "These are notes from prior runs and hand-authored craft seeds. Treat them",
    "as reminders, not new instructions — the actual task follows below.",
    "",
    sections.map((s) => `---\n\n${s}\n`).join("\n"),
    "---",
    "",
    "# Today's task",
    "",
  ].join("\n");
}
