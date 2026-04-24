/**
 * Parse file writes out of a model response.
 *
 * Reality of model output (captured 2026-04-24): models routinely wrap
 * file bodies in markdown code fences and skip the explicit ===END===
 * marker. We accept three shapes:
 *
 *   A) Canonical:
 *      ===FILE: path===
 *      <body>
 *      ===END===
 *
 *   B) Marker-opened, fence-terminated (qwen3's habit):
 *      ===FILE: path===
 *      ```lang
 *      <body>
 *      ```
 *      (no ===END===)
 *
 *   C) Fence-only with caller-provided filename hint (defensive fallback):
 *      ```lang
 *      <body>
 *      ```
 *
 * For shape A, if the extracted body is itself a single wrapping code
 * fence (```lang\n...\n```), we strip it — that's the model being extra
 * "helpful" with nested fences and should not end up in the file.
 *
 * All parsing is pure (no I/O). Correctness is gated by unit tests against
 * captured real-model fixtures.
 */

export interface ExtractedFile {
  path: string;
  content: string;
}

export interface ParseResult {
  files: ExtractedFile[];
  warnings: string[];
}

export interface ParseOptions {
  /**
   * Single-file fallback hint. When set and no ===FILE: markers are
   * present, the first fenced code block is treated as this file.
   */
  expectedSingleFile?: string;
}

/** Shape A — canonical, with explicit ===END=== closer. */
const SHAPE_A_RE =
  /===FILE:\s*(.+?)\s*===\s*\r?\n([\s\S]*?)\r?\n===END===/g;

/**
 * Shape B — ===FILE: opener, closed by a markdown fence. Requires the body
 * to start (after optional whitespace) with a fence, and terminates at the
 * matching closing fence. Non-greedy on body so multiple B-blocks in a
 * single response don't swallow each other.
 */
const SHAPE_B_RE =
  /===FILE:\s*(.+?)\s*===\s*\r?\n\s*```(?:[\w.+-]*)\r?\n([\s\S]*?)\r?\n\s*```/g;

/** Fallback — first fenced block anywhere in the content. */
const FIRST_FENCE_RE = /```(?:[\w.+-]*)\r?\n([\s\S]*?)\r?\n```/;

/**
 * If a body is wholly wrapped in a single markdown fence (```lang\n...\n```),
 * unwrap it. This is defensive — some models put fences inside ===FILE:
 * blocks "for clarity" even when told not to.
 */
function stripWrappingFence(body: string): string {
  const m = body.match(/^\s*```(?:[\w.+-]*)\r?\n([\s\S]*?)\r?\n```\s*$/);
  return m ? m[1] : body;
}

export function parseFiles(
  content: string,
  opts: ParseOptions = {}
): ParseResult {
  const files: ExtractedFile[] = [];
  const warnings: string[] = [];
  const claimed: Array<[number, number]> = []; // [start, end) spans already consumed

  const overlaps = (s: number, e: number) =>
    claimed.some(([cs, ce]) => s < ce && cs < e);

  // Pass 1: canonical ===END===-closed blocks.
  for (const m of content.matchAll(SHAPE_A_RE)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (overlaps(start, end)) continue;
    const path = m[1];
    const body = stripWrappingFence(m[2]);
    const err = validatePath(path);
    if (err) {
      warnings.push(`skipped unsafe path "${path}": ${err}`);
      continue;
    }
    files.push({ path, content: body });
    claimed.push([start, end]);
  }

  // Pass 2: marker-opened, fence-terminated (no ===END===).
  for (const m of content.matchAll(SHAPE_B_RE)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (overlaps(start, end)) continue;
    const path = m[1];
    const body = m[2];
    const err = validatePath(path);
    if (err) {
      warnings.push(`skipped unsafe path "${path}": ${err}`);
      continue;
    }
    files.push({ path, content: body });
    claimed.push([start, end]);
    warnings.push(
      `shape B: ===FILE: "${path}" was closed by a code fence, not ===END===`
    );
  }

  if (files.length > 0) {
    // Sort by file-order in the source, so multi-file outputs retain order
    files.sort((a, b) => content.indexOf(a.content) - content.indexOf(b.content));
    return { files, warnings };
  }

  // Pass 3: single-fence fallback with caller hint.
  if (opts.expectedSingleFile) {
    const fence = content.match(FIRST_FENCE_RE);
    if (fence) {
      const err = validatePath(opts.expectedSingleFile);
      if (err) {
        warnings.push(
          `skipped unsafe expectedSingleFile "${opts.expectedSingleFile}": ${err}`
        );
      } else {
        files.push({ path: opts.expectedSingleFile, content: fence[1] });
        warnings.push(
          `fallback: no markers found; extracted first fenced block as ${opts.expectedSingleFile}`
        );
      }
    } else {
      warnings.push(
        "no ===FILE: markers and no fenced code block found in response"
      );
    }
  } else {
    warnings.push(
      "no ===FILE: markers found (no expectedSingleFile fallback hint provided)"
    );
  }

  return { files, warnings };
}

/**
 * Reject paths that could escape the workspace or otherwise be unsafe.
 */
function validatePath(p: string): string | null {
  if (!p || !p.trim()) return "empty path";
  const trimmed = p.trim();
  if (trimmed.startsWith("/")) return "absolute paths not allowed";
  if (trimmed.match(/^[a-zA-Z]:[\\/]/)) return "Windows-drive paths not allowed";
  if (trimmed.split(/[\\/]/).includes("..")) return "parent traversal (..) not allowed";
  if (trimmed.includes("\0")) return "null byte not allowed";
  return null;
}
