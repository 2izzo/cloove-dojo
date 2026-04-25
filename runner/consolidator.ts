// runner/consolidator.ts
//
// Per-cloove mempalace consolidator. Files drawers after a kata run.
//
// Adlerian filing rule: positive-first, sparse on purpose.
//
//   full pass (all tests + clean DONE status)        → WIN drawer
//   all tests failed OR timeout/blocked              → SCAR drawer
//   anything else (partial pass, partial fail, etc.) → silent (file nothing)
//
// Most kata runs produce nothing. Wins are the dominant signal; scars are
// reserved for catastrophic outcomes. No paradigm-grading yet — the v1
// drawer body is just the structured run data. Grading is a Rung-2 problem.
//
// Storage layout (per cloove):
//
//   /data/cloove-dojo/.palaces/<cloove>/
//     ├── storage/    ← mempalace vector index (gitignored, binary)
//     └── content/
//         ├── wins/<kata>/<date>-ring<R>-run<NN>-<prompt>.md
//         ├── scars/<kata>/<date>-ring<R>-run<NN>-<reason>.md
//         └── general/    (cross-kata craft notes, hand-written)
//
// After writing a drawer, the consolidator runs `mempalace mine` to ingest.
// If mempalace is unavailable, we log a warning and continue — the runner
// must never fail because the palace is sad.

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

export type ClooveRole = "dev" | "sdet";
export type Verdict = "win" | "scar" | "silent";

export interface BackendKataResult {
  kata: string;
  ring: number;
  prompt: string;
  model: string;
  run_number: number;
  tests_pass: boolean;
  tests_total: number;
  tests_passing: number;
  cycles: number;
  time_seconds: number;
  status: string;
  timestamp: string;
  workspace: string;
  timed_out: boolean;
  exit_code: number;
}

const MEMPALACE_BIN =
  process.env.MEMPALACE_BIN || "/home/squibs/.local/bin/mempalace";

function classifyBackend(r: BackendKataResult): Verdict {
  // WIN: clean full pass, no concerns flagged.
  if (
    r.tests_pass &&
    r.tests_total > 0 &&
    r.tests_passing === r.tests_total &&
    r.status === "DONE"
  ) {
    return "win";
  }

  // SCAR: catastrophic — nothing worked, or harness gave up.
  if (
    r.tests_passing === 0 ||
    r.status === "TIMEOUT" ||
    r.status === "BLOCKED" ||
    r.timed_out
  ) {
    return "scar";
  }

  // Partial pass, DONE_WITH_CONCERNS, etc. — silent.
  return "silent";
}

function paddedRun(n: number): string {
  return String(n).padStart(2, "0");
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Pull date + HHMMSS out of an ISO timestamp, dropping ms and tz.
 *   "2026-04-25T17:27:24.899Z" -> { date: "2026-04-25", time: "172724" }
 *
 * The time component prevents drawer-filename collisions across batches —
 * two batches firing the same kata×ring×prompt×run-number on the same day
 * would overwrite each other without it.
 */
function dateTimeFromIso(iso: string): { date: string; time: string } {
  const [date, rest] = iso.split("T");
  const time = (rest ?? "").split(".")[0].replace(/:/g, "");
  return { date, time };
}

function writeWinDrawer(
  dojoRoot: string,
  cloove: ClooveRole,
  r: BackendKataResult
): string {
  const { date, time } = dateTimeFromIso(r.timestamp);
  const dir = join(dojoRoot, ".palaces", cloove, "content", "wins", r.kata);
  mkdirSync(dir, { recursive: true });

  const drawerPath = join(
    dir,
    `${date}-${time}-ring${r.ring}-run${paddedRun(r.run_number)}-${slug(r.prompt)}.md`
  );

  const body = `---
type: win
cloove: ${cloove}
kata: ${r.kata}
ring: ${r.ring}
prompt: ${r.prompt}
model: ${r.model}
run: ${r.run_number}
date: ${date}
cycles: ${r.cycles}
time_seconds: ${r.time_seconds.toFixed(1)}
---

# Win — ${r.kata} Ring ${r.ring} run ${paddedRun(r.run_number)}

Clean pass: ${r.tests_passing}/${r.tests_total} tests green, status \`${r.status}\`, ${r.cycles} cycle${r.cycles === 1 ? "" : "s"}, ${r.time_seconds.toFixed(1)}s.

## What this might be teaching

[v1 placeholder — paradigm-grading is a Rung-2 experiment. For now the win is its own signal: this prompt × model × kata produced clean code that passed cleanly.]

## Run snapshot

\`\`\`json
${JSON.stringify(r, null, 2)}
\`\`\`
`;

  writeFileSync(drawerPath, body);
  return drawerPath;
}

function writeScarDrawer(
  dojoRoot: string,
  cloove: ClooveRole,
  r: BackendKataResult,
  reason: string
): string {
  const { date, time } = dateTimeFromIso(r.timestamp);
  const dir = join(dojoRoot, ".palaces", cloove, "content", "scars", r.kata);
  mkdirSync(dir, { recursive: true });

  const drawerPath = join(
    dir,
    `${date}-${time}-ring${r.ring}-run${paddedRun(r.run_number)}-${slug(reason)}.md`
  );

  const body = `---
type: scar
cloove: ${cloove}
kata: ${r.kata}
ring: ${r.ring}
prompt: ${r.prompt}
model: ${r.model}
run: ${r.run_number}
date: ${date}
reason: ${reason}
---

# Scar — ${r.kata} Ring ${r.ring} run ${paddedRun(r.run_number)}

Catastrophic outcome: ${r.tests_passing}/${r.tests_total} tests, status \`${r.status}\`.
Filed because: **${reason}**.

Adlerian rule: most failures are silent; only the harsh ones earn a scar. This run earned one — the model produced something that failed completely or the harness gave up.

## Run snapshot

\`\`\`json
${JSON.stringify(r, null, 2)}
\`\`\`
`;

  writeFileSync(drawerPath, body);
  return drawerPath;
}

function mineDrawer(dojoRoot: string, cloove: ClooveRole): void {
  const palacePath = join(dojoRoot, ".palaces", cloove, "storage");
  const contentPath = join(dojoRoot, ".palaces", cloove, "content");

  try {
    execSync(
      `${MEMPALACE_BIN} --palace "${palacePath}" mine "${contentPath}" --agent ${cloove}-cloove`,
      { stdio: "pipe", encoding: "utf8" }
    );
  } catch (e: any) {
    const msg = (e?.message ?? String(e)).split("\n")[0];
    console.warn(`  consolidator: mempalace mine failed (continuing): ${msg}`);
  }
}

export function consolidateBackendRun(
  dojoRoot: string,
  cloove: ClooveRole,
  result: BackendKataResult
): { verdict: Verdict; drawerPath: string | null } {
  const palaceRoot = join(dojoRoot, ".palaces", cloove);

  // No palace? No-op. The runner must never fail because the palace is missing.
  if (!existsSync(palaceRoot)) {
    return { verdict: "silent", drawerPath: null };
  }

  const verdict = classifyBackend(result);

  if (verdict === "silent") {
    return { verdict, drawerPath: null };
  }

  let drawerPath: string;
  if (verdict === "win") {
    drawerPath = writeWinDrawer(dojoRoot, cloove, result);
    console.log(`  ⌬ filed WIN drawer → ${drawerPath.replace(dojoRoot + "/", "")}`);
  } else {
    const reason =
      result.timed_out || result.status === "TIMEOUT"
        ? "timeout"
        : result.status === "BLOCKED"
        ? "blocked"
        : "all-tests-failed";
    drawerPath = writeScarDrawer(dojoRoot, cloove, result, reason);
    console.log(`  ⌬ filed SCAR drawer → ${drawerPath.replace(dojoRoot + "/", "")}`);
  }

  mineDrawer(dojoRoot, cloove);
  return { verdict, drawerPath };
}
