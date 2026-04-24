/**
 * Parse file writes out of a model response.
 *
 * Primary format (driven by the harness's system prompt):
 *
 *   ===FILE: <relative/path>===
 *   <raw file content>
 *   ===END===
 *
 * Fallback (defensive — model ignored the system prompt):
 *   If no ===FILE: markers are found AND the caller passed a single expected
 *   filename via `expectedSingleFile`, treat the first fenced code block as
 *   that file's content and emit a warning.
 *
 * Everything here is pure: no I/O, no side effects. That's the point —
 * correctness is gated by unit tests against captured real-model fixtures.
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
   * Single-file fallback hint. When set and no ===FILE: markers are present,
   * the first fenced code block in the response is treated as this file.
   * Leave undefined for strict (marker-only) parsing.
   */
  expectedSingleFile?: string;
}

/** Match ===FILE: path===\n<body>\n===END=== greedily-but-lazily. */
const FILE_MARKER_RE = /===FILE:\s*(.+?)\s*===\s*\r?\n([\s\S]*?)\r?\n===END===/g;

/** Match a markdown code fence, optional language tag. */
const FENCE_RE = /```(?:[\w.-]*)\r?\n([\s\S]*?)\r?\n```/;

export function parseFiles(
  content: string,
  opts: ParseOptions = {}
): ParseResult {
  const files: ExtractedFile[] = [];
  const warnings: string[] = [];

  // Primary pass: collect all ===FILE: blocks.
  for (const match of content.matchAll(FILE_MARKER_RE)) {
    const rawPath = match[1];
    const body = match[2];
    const err = validatePath(rawPath);
    if (err) {
      warnings.push(`skipped unsafe path "${rawPath}": ${err}`);
      continue;
    }
    files.push({ path: rawPath, content: body });
  }

  if (files.length > 0) {
    return { files, warnings };
  }

  // Fallback: single fenced block, with caller hint.
  if (opts.expectedSingleFile) {
    const fence = content.match(FENCE_RE);
    if (fence) {
      const err = validatePath(opts.expectedSingleFile);
      if (err) {
        warnings.push(
          `skipped unsafe expectedSingleFile "${opts.expectedSingleFile}": ${err}`
        );
      } else {
        files.push({ path: opts.expectedSingleFile, content: fence[1] });
        warnings.push(
          `fallback: no ===FILE: markers found; extracted first fenced block as ${opts.expectedSingleFile}`
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
 * Applied to both parsed ===FILE: paths and fallback hints.
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
