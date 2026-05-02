// runner/grader.ts
//
// Paradigm grading via CoT-per-seed atomic checks against Ollama.
//
// v0 architecture (decided 2026-05-02 in the classification feasibility probe):
//   - Single-shot multi-seed classification hit a model ceiling: both
//     qwen3-coder-next and qwen3:8b failed to apply negative criteria
//     ("disqualifying signals") to seeds like clean-guards-and-early-returns.
//   - Chain-of-thought reasoning on ONE seed at a time fixes this. The model
//     correctly identifies all violations when forced to reason explicitly.
//   - Trade-off: more inference calls per kata (~4 backend seeds per win),
//     but each is parallelizable. 4 parallel calls on the Wires complete
//     in ~30s using qwen3-coder-next at temperature=0 + seed=42 for
//     deterministic output.
//
// v0 scope: seeds only, backend TypeScript katas only. Patterns and
// gap_observed are explicit v0.1 work — patterns add 5 more parallel
// checks, gap_observed needs a stricter prompt schema (v3 misuse showed
// the model treats it as "absent seed" rather than "novel topic").

const OLLAMA_API = process.env.OLLAMA_API ?? "http://localhost:11434/api/generate";
const GRADER_MODEL = process.env.GRADER_MODEL ?? "qwen3-coder-next:latest";

// --- Seed definitions for backend TypeScript katas ---
//
// Each definition is the EXACT text the CoT prompt embeds. Sharpened with
// "disqualifying signals" / "if X is true, the seed does not apply" clauses
// because vague definitions let the model pattern-match on keywords.
//
// To add a seed: append to this object. To deprecate: remove from the
// SEEDS_TO_CHECK list passed at call time.

const BACKEND_SEED_DEFS: Record<string, string> = {
  "clean-guards-and-early-returns":
    "A function embodies this when it (a) starts with one or more guard clauses at the TOP that reject bad inputs by throwing or returning early, AND (b) has FLAT main control flow afterward (no nested if/else 3+ levels deep), AND (c) does NOT wrap its main work inside a positive `if (valid) { ... }` block with the throw in an `else`. If ANY of (b) or (c) fails, the seed does NOT apply even if (a) is satisfied.",

  "typescript-not-javascript":
    "A code file embodies this when it uses TypeScript type annotations: parameter types (`x: number`), return types (`function foo(): string[]`), interfaces, or generics. It does NOT embody this if it uses plain JavaScript without type annotations (no colons after parameters, no return type declarations, only `var`/`let`/`const` without typed initialization).",

  "clean-polymorphic-dispatch":
    "A code file embodies this when it replaces a long type-discriminator chain (`if (x.kind === 'A') ... else if (x.kind === 'B') ...`) with one of: a strategy table (map from key to function), polymorphic method dispatch on a class, or a switch on a discriminated union with handler delegation. Plain `if/else if` chains on numeric or boolean conditions do NOT embody this — only chains discriminating on type/kind/name fields and refactored away from the conditional ladder.",

  "inverse-pair-roundtrip":
    "A code file embodies this when it provides BOTH halves of a natural inverse pair (encode AND decode, push AND pop, serialize AND deserialize) as exported functions, AND the structure makes their composition visibly correct (e.g., decode(encode(x)) === x by construction). A function that only implements ONE half does NOT embody this even if its name implies an inverse exists.",
};

const DEFAULT_BACKEND_SEEDS = Object.keys(BACKEND_SEED_DEFS);

export interface SeedVerdict {
  seed: string;
  embodied: boolean;
  reasoning: string;
}

export interface GradeResult {
  kata: string;
  workspace: string;
  embodied_seeds: string[];
  rejected_seeds: string[];
  verdicts: SeedVerdict[];
  duration_ms: number;
}

// --- CoT prompt construction ---

function buildCotPrompt(
  seedName: string,
  seedDef: string,
  code: string,
  kata: string,
): string {
  return `You are reviewing TypeScript code. For ONE seed only — ${seedName} — decide if this code embodies it. Reason step by step BEFORE answering.

DEFINITION:
${seedDef}

CODE (kata: ${kata}, all tests passing):
\`\`\`typescript
${code}
\`\`\`

REASONING (write 3-5 sentences analyzing the code against the definition):

VERDICT (true or false):
`;
}

// --- Ollama API call (deterministic) ---

async function callOllama(prompt: string): Promise<string> {
  const body = {
    model: GRADER_MODEL,
    prompt,
    stream: false,
    options: { temperature: 0, seed: 42 },
  };
  const res = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Ollama API ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { response: string };
  return json.response;
}

// --- Verdict parsing ---
//
// The CoT response ends with "VERDICT (true or false): true" or similar.
// We grep for the last `true`/`false` token after the word "VERDICT".
// Conservative parser: if we can't find a clean signal, return false +
// log the raw response. Better to skip filing a seed than to mis-file.

function parseVerdict(response: string): { embodied: boolean; reasoning: string } {
  const cleaned = response.replace(/\r/g, "").trim();
  // Take everything before the VERDICT line as reasoning.
  const verdictIdx = cleaned.toUpperCase().lastIndexOf("VERDICT");
  const reasoning = (verdictIdx >= 0 ? cleaned.slice(0, verdictIdx) : cleaned)
    .replace(/^\s*REASONING\s*[:(].*?\)?\s*:?\s*/i, "")
    .trim();
  const tail = (verdictIdx >= 0 ? cleaned.slice(verdictIdx) : cleaned).toLowerCase();
  // Look for the first clean true/false occurrence after the verdict marker.
  const m = tail.match(/\b(true|false)\b/);
  if (!m) {
    console.warn(`grader: no verdict found in response. Defaulting to false.`);
    return { embodied: false, reasoning };
  }
  return { embodied: m[1] === "true", reasoning };
}

// --- Single seed grade ---

export async function gradeOneSeed(
  seedName: string,
  code: string,
  kata: string,
  seedDef?: string,
): Promise<SeedVerdict> {
  const def = seedDef ?? BACKEND_SEED_DEFS[seedName];
  if (!def) throw new Error(`grader: no definition for seed "${seedName}"`);
  const prompt = buildCotPrompt(seedName, def, code, kata);
  const response = await callOllama(prompt);
  const { embodied, reasoning } = parseVerdict(response);
  return { seed: seedName, embodied, reasoning };
}

// --- Full grade ---
//
// Runs all requested seed checks in parallel. Returns structured result
// with per-seed verdicts + reasoning. Caller (consolidator) decides which
// to embed in the drawer frontmatter and which to elide.

export async function gradeWin(
  workspace: string,
  kata: string,
  options: { srcPath?: string; seeds?: string[] } = {},
): Promise<GradeResult> {
  const startedAt = Date.now();
  const srcPath = options.srcPath ?? `${workspace}/src/${kata}.ts`;
  const seeds = options.seeds ?? DEFAULT_BACKEND_SEEDS;

  const fs = await import("fs");
  if (!fs.existsSync(srcPath)) {
    throw new Error(`grader: source not found at ${srcPath}`);
  }
  const code = fs.readFileSync(srcPath, "utf-8");

  const verdicts = await Promise.all(
    seeds.map((s) => gradeOneSeed(s, code, kata)),
  );

  return {
    kata,
    workspace,
    embodied_seeds: verdicts.filter((v) => v.embodied).map((v) => v.seed),
    rejected_seeds: verdicts.filter((v) => !v.embodied).map((v) => v.seed),
    verdicts,
    duration_ms: Date.now() - startedAt,
  };
}

// --- CLI entry point ---
//
// Usage: bun run runner/grader.ts --workspace <path> --kata <name> [--src <path>]
//
// Prints the GradeResult as JSON. Use for verifying classifier output on
// arbitrary workspaces before consolidator integration. Returns exit 1
// on errors so it's scriptable.

if (import.meta.main) {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const workspace = get("--workspace");
  const kata = get("--kata");
  const src = get("--src");
  if (!workspace || !kata) {
    console.error("usage: bun run runner/grader.ts --workspace <path> --kata <name> [--src <path>]");
    process.exit(1);
  }
  gradeWin(workspace, kata, { srcPath: src }).then(
    (r) => {
      console.log(JSON.stringify(r, null, 2));
    },
    (e) => {
      console.error(`grader error: ${e?.message ?? e}`);
      process.exit(1);
    },
  );
}
