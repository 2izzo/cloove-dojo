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
import type { Stats } from "fs";
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
  /**
   * Hard cap on the number of seed drawers included in the preamble.
   * Default 5. When more seeds match the kata type than this, the most
   * recently modified seeds win (mtime-descending). This bounds preamble
   * length so devstral doesn't fall off its instruction-following cliff
   * around ~8K chars. Authors should iterate seeds for impact, not volume.
   */
  topNSeeds?: number;
  /**
   * Free-form text used to semantically search the patterns/ room for
   * relevant labeled algorithmic vocabulary. Typically the kata's
   * description.md + architecture.md concatenated. When empty, no
   * patterns are loaded.
   */
  searchQuery?: string;
  /**
   * Hard cap on the number of pattern drawers included in the preamble.
   * Default 3 — patterns are LARGER than seeds (worked examples on
   * neutral data) so the cap is tighter. Patterns are ranked by
   * mempalace search relevance against searchQuery; only patterns with
   * match score above the threshold are included.
   */
  topNPatterns?: number;
  /**
   * Minimum relevance score (0..1) for a pattern to be included. Default
   * 0.30. Patterns below this threshold are skipped — better to include
   * none than to inject irrelevant vocabulary.
   */
  patternMatchThreshold?: number;
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
/**
 * Sanitize a search query for safe shell embedding. Strips markdown
 * special characters, collapses whitespace, truncates to a reasonable
 * length so the command line doesn't blow up. The result is a plain
 * keyword bag suitable for semantic-similarity search.
 */
function sanitizeQuery(query: string): string {
  return query
    .replace(/[`#*_~|\\]/g, " ")     // strip markdown markers
    .replace(/[\r\n]+/g, " ")        // newlines → spaces
    .replace(/["']/g, " ")           // strip quotes (avoid shell escaping)
    .replace(/\s+/g, " ")            // collapse whitespace
    .trim()
    .slice(0, 600);                  // cap at 600 chars; semantic search only
                                     // needs the keyword distribution
}

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
  const safeQuery = sanitizeQuery(query);
  if (!safeQuery) return [];
  try {
    const out = execSync(
      `${MEMPALACE_BIN} --palace "${palacePath}" search "${safeQuery}" --results ${pool}`,
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
 * List hand-authored seed drawers for the preamble, with two-step filtering:
 *
 *   1. Match by kata type (drop seeds whose applies_to: declares the other
 *      type — so backend-only seeds don't appear in fullstack preambles
 *      and vice versa).
 *
 *   2. Cap by topNSeeds (devstral falls off its instruction-following
 *      cliff around ~8K chars of preamble; with avg ~1500 chars/seed that's
 *      ~5 seeds max). When more seeds match than the cap, the most recently
 *      modified seeds win — authors can iterate behavior by editing or
 *      adding seeds, knowing the freshest ones outrank the stalest.
 */
function listSeedDrawers(
  contentRoot: string,
  kataType?: KataType,
  topNSeeds?: number
): string[] {
  const generalDir = join(contentRoot, "general");
  if (!existsSync(generalDir)) return [];

  let all = readdirSync(generalDir)
    .filter((f) => f.startsWith("seed-") && f.endsWith(".md"))
    .map((f) => join(generalDir, f));

  if (kataType) {
    all = all.filter((p) =>
      seedMatchesKataType(readSeedAppliesTo(p), kataType)
    );
  }

  if (topNSeeds !== undefined && all.length > topNSeeds) {
    // Take the topNSeeds freshest by mtime.
    const withMtime = all.map((p) => ({ p, m: safeMtime(p) }));
    withMtime.sort((a, b) => b.m - a.m);
    all = withMtime.slice(0, topNSeeds).map((x) => x.p);
  }

  return all.sort(); // deterministic ordering once selected
}

function safeMtime(path: string): number {
  try {
    const s: Stats = statSync(path);
    return s.mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Find labeled algorithmic patterns in the patterns/ room that match the
 * given search query (typically the kata's description). Returns absolute
 * paths to drawer files, ranked by relevance, capped at topN, and
 * filtered to only patterns whose match score is at least threshold.
 *
 * Patterns are distinct from seeds: seeds are general principles ("write
 * tests when none provided"), patterns are specific algorithmic
 * vocabulary on neutral data ("here's how a binary heap is implemented,
 * with sift-up/sift-down on a generic numeric example"). Patterns are
 * loaded by semantic relevance, not by always-include.
 */
function findPatterns(
  dojoRoot: string,
  role: ClooveRole,
  query: string,
  topN: number,
  threshold: number,
): string[] {
  if (!query || !query.trim()) return [];
  const contentRoot = join(dojoRoot, ".palaces", role, "content");
  const patternsDir = join(contentRoot, "patterns");
  if (!existsSync(patternsDir)) return [];

  const hits = searchPalace(dojoRoot, role, query, topN * 4);
  // Patterns are identified by filename prefix `pattern-` and are physically
  // located in .palaces/<role>/content/patterns/. The mempalace room
  // assignment can be stale (yaml was updated after initial mining); the
  // filename prefix is the canonical identifier.
  const patternHits = hits.filter(
    (h) => h.source.startsWith("pattern-") && h.matchScore >= threshold,
  );

  // Dedupe by source — keep highest-scoring chunk per drawer.
  const bySource = new Map<string, SearchHit>();
  for (const h of patternHits) {
    const cur = bySource.get(h.source);
    if (!cur || h.matchScore > cur.matchScore) bySource.set(h.source, h);
  }

  const ranked = Array.from(bySource.values())
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);

  const paths: string[] = [];
  for (const hit of ranked) {
    const direct = join(patternsDir, hit.source);
    if (existsSync(direct)) {
      paths.push(direct);
    }
  }
  return paths;
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

  // 1. Seeds — generalizable principles. Always include up to topNSeeds.
  const topNSeeds = options.topNSeeds ?? 5;
  const seedPaths = listSeedDrawers(contentRoot, options.kataType, topNSeeds);

  // 2. Patterns — labeled algorithmic vocabulary on neutral data. Loaded
  //    by semantic relevance to searchQuery (typically the kata
  //    description). Only included when match score is high enough that
  //    the pattern is genuinely relevant; otherwise nothing.
  //
  //    Default cap is 2 patterns (each ~1.5-2K chars). Combined with the
  //    seed budget this keeps total preamble under devstral's
  //    instruction-following cliff (~10K for backend katas).
  const topNPatterns = options.topNPatterns ?? 2;
  const patternThreshold = options.patternMatchThreshold ?? 0.30;
  const patternPaths = findPatterns(
    dojoRoot,
    role,
    options.searchQuery ?? "",
    topNPatterns,
    patternThreshold,
  );

  // 3. Scars are still disabled in v1 (no diagnostic signal in current
  //    scar format). The search infrastructure is kept in place via
  //    findPatterns + searchPalace for re-enable later.
  void pool; void extra;

  if (seedPaths.length === 0 && patternPaths.length === 0) return "";

  const seedSections: string[] = [];
  for (const path of seedPaths) {
    try {
      const body = stripFrontmatter(readFileSync(path, "utf-8"));
      if (body) seedSections.push(body);
    } catch { /* skip */ }
  }

  const patternSections: string[] = [];
  for (const path of patternPaths) {
    try {
      const body = stripFrontmatter(readFileSync(path, "utf-8"));
      if (body) patternSections.push(body);
    } catch { /* skip */ }
  }

  if (seedSections.length === 0 && patternSections.length === 0) return "";

  const out: string[] = [];

  if (seedSections.length > 0) {
    out.push("# Things you've learned on similar katas before");
    out.push("");
    out.push("These are notes from prior runs and hand-authored craft seeds. Treat them");
    out.push("as reminders, not new instructions — the actual task follows below.");
    out.push("");
    out.push(seedSections.map((s) => `---\n\n${s}\n`).join("\n"));
    out.push("---");
    out.push("");
  }

  if (patternSections.length > 0) {
    out.push("# Algorithmic patterns from your toolkit");
    out.push("");
    out.push("These are labeled implementations of common patterns — the vocabulary you");
    out.push("draw on when building solutions. They use neutral example data; adapt the");
    out.push("shape to today's task, don't copy the example values.");
    out.push("");
    out.push(patternSections.map((s) => `---\n\n${s}\n`).join("\n"));
    out.push("---");
    out.push("");
  }

  out.push("# Today's task");
  out.push("");
  return out.join("\n");
}
