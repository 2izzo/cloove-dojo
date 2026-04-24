import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseFiles } from "../../../runner/adapters/parse-files";

const FIXTURES = resolve(__dirname, "../../fixtures/model-responses");

function fixtureContent(name: string): string {
  const raw = readFileSync(resolve(FIXTURES, name), "utf-8");
  const body = JSON.parse(raw);
  return body.message.content as string;
}

describe("parseFiles — primary (===FILE:) format", () => {
  it("extracts a single file block", () => {
    const input = [
      "Some prose before.",
      "===FILE: bowling.ts===",
      "export class Game {",
      "  // ...",
      "}",
      "===END===",
      "Some prose after.",
    ].join("\n");

    const result = parseFiles(input);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("bowling.ts");
    expect(result.files[0].content).toBe(
      "export class Game {\n  // ...\n}"
    );
    expect(result.warnings).toEqual([]);
  });

  it("extracts multiple file blocks in order", () => {
    const input = [
      "===FILE: src/a.ts===",
      "export const a = 1;",
      "===END===",
      "between",
      "===FILE: src/b.ts===",
      "export const b = 2;",
      "===END===",
    ].join("\n");

    const result = parseFiles(input);
    expect(result.files.map((f) => f.path)).toEqual(["src/a.ts", "src/b.ts"]);
    expect(result.files[0].content).toBe("export const a = 1;");
    expect(result.files[1].content).toBe("export const b = 2;");
  });

  it("tolerates whitespace around the path", () => {
    const input = "===FILE:   bowling.ts  ===\nexport const x = 1;\n===END===";
    const result = parseFiles(input);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("bowling.ts");
  });

  it("skips blocks whose path is unsafe and warns", () => {
    const input = [
      "===FILE: /etc/passwd===",
      "bad",
      "===END===",
      "===FILE: ../escape.ts===",
      "bad",
      "===END===",
      "===FILE: C:\\Windows\\system32===",
      "bad",
      "===END===",
      "===FILE: safe.ts===",
      "export const x = 1;",
      "===END===",
    ].join("\n");

    const result = parseFiles(input);
    expect(result.files.map((f) => f.path)).toEqual(["safe.ts"]);
    expect(result.warnings.length).toBe(3);
    expect(result.warnings.some((w) => w.includes("absolute"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("parent traversal"))).toBe(
      true
    );
    expect(result.warnings.some((w) => w.includes("Windows-drive"))).toBe(true);
  });

  it("ignores blocks with no closing ===END=== and falls through", () => {
    const input = "===FILE: orphan.ts===\nexport const x = 1;\n";
    const result = parseFiles(input);
    expect(result.files).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/no ===FILE:/);
  });
});

describe("parseFiles — fallback (single fence)", () => {
  it("uses first fenced block when expectedSingleFile is provided", () => {
    const input = [
      "Here's the implementation:",
      "",
      "```typescript",
      "export class Game {",
      "  roll(p: number) {}",
      "}",
      "```",
      "",
      "Explanation follows.",
    ].join("\n");

    const result = parseFiles(input, { expectedSingleFile: "bowling.ts" });
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("bowling.ts");
    expect(result.files[0].content).toBe(
      "export class Game {\n  roll(p: number) {}\n}"
    );
    expect(result.warnings[0]).toMatch(/fallback/);
  });

  it("warns when no markers and no fence are present", () => {
    const result = parseFiles("Just prose, no code.", {
      expectedSingleFile: "bowling.ts",
    });
    expect(result.files).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/no fenced code block/);
  });

  it("warns when no markers and no hint is given", () => {
    const result = parseFiles("```ts\nconst x = 1;\n```");
    expect(result.files).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/no expectedSingleFile/);
  });

  it("refuses unsafe expectedSingleFile hint", () => {
    const input = "```ts\nconst x = 1;\n```";
    const result = parseFiles(input, { expectedSingleFile: "../pwn.ts" });
    expect(result.files).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("parent traversal"))).toBe(
      true
    );
  });
});

describe("parseFiles — against real captured model fixtures", () => {
  it("fallback-extracts qwen3-coder-next bowling output via single-fence hint", () => {
    const content = fixtureContent("qwen3-coder-next-bowling-ring1.json");
    const result = parseFiles(content, { expectedSingleFile: "bowling.ts" });
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("bowling.ts");
    expect(result.files[0].content).toContain("export class Game");
    expect(result.files[0].content).toContain("score(): number");
    // Confirms no markers were needed — the fallback carried it.
    expect(result.warnings[0]).toMatch(/fallback/);
  });

  it("fallback-extracts devstral-dojo bowling output via single-fence hint", () => {
    // Devstral emits a markdown fence THEN a Cline-style <write_to_file> block.
    // With a single-fence hint the markdown fence wins (and we don't accidentally
    // ingest the XML-wrapped code, which would double-write).
    const content = fixtureContent("devstral-dojo-bowling-ring1.json");
    const result = parseFiles(content, { expectedSingleFile: "bowling.ts" });
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("bowling.ts");
    expect(result.files[0].content).toContain("export class Game");
    expect(result.files[0].content).toContain("private rolls: number[]");
  });

  it("real fixtures currently contain no ===FILE: markers (pre-harness capture)", () => {
    // Sanity check: these were captured BEFORE the new system prompt existed.
    // If this ever starts failing, someone re-captured with the new prompt —
    // update the test expectations accordingly.
    for (const f of [
      "qwen3-coder-next-bowling-ring1.json",
      "devstral-dojo-bowling-ring1.json",
    ]) {
      const content = fixtureContent(f);
      expect(content.includes("===FILE:")).toBe(false);
    }
  });
});

describe("parseFiles — shape B (marker-opened, fence-terminated, no ===END===)", () => {
  it("extracts a marker-opened fence-terminated block", () => {
    const input = [
      "===FILE: bowling.ts===",
      "```typescript",
      "export class Game {",
      "  roll(p: number) {}",
      "}",
      "```",
    ].join("\n");
    const result = parseFiles(input);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("bowling.ts");
    expect(result.files[0].content).toContain("export class Game");
    expect(result.files[0].content).not.toContain("```");
    expect(result.warnings.some((w) => w.includes("shape B"))).toBe(true);
  });

  it("handles two shape-B blocks back to back", () => {
    const input = [
      "===FILE: src/a.ts===",
      "```ts",
      "export const a = 1;",
      "```",
      "",
      "===FILE: src/b.ts===",
      "```ts",
      "export const b = 2;",
      "```",
    ].join("\n");
    const result = parseFiles(input);
    expect(result.files.map((f) => f.path)).toEqual(["src/a.ts", "src/b.ts"]);
    expect(result.files[0].content).toBe("export const a = 1;");
    expect(result.files[1].content).toBe("export const b = 2;");
  });

  it("prefers shape A over shape B when both could match", () => {
    // A-block for foo.ts, B-block for bar.ts — both extracted, neither misassigned
    const input = [
      "===FILE: foo.ts===",
      "export const foo = 1;",
      "===END===",
      "",
      "===FILE: bar.ts===",
      "```ts",
      "export const bar = 2;",
      "```",
    ].join("\n");
    const result = parseFiles(input);
    expect(result.files.map((f) => f.path)).toEqual(["foo.ts", "bar.ts"]);
    expect(result.files[0].content).toBe("export const foo = 1;");
    expect(result.files[1].content).toBe("export const bar = 2;");
  });
});

describe("parseFiles — wrapping-fence strip inside shape A", () => {
  it("strips a single wrapping ```lang fence inside an ===END===-closed block", () => {
    const input = [
      "===FILE: bowling.ts===",
      "```typescript",
      "export class Game {}",
      "```",
      "===END===",
    ].join("\n");
    const result = parseFiles(input);
    expect(result.files[0].content).toBe("export class Game {}");
    expect(result.files[0].content).not.toContain("```");
  });

  it("leaves non-wrapping fences alone (fence in the middle of content)", () => {
    const input = [
      "===FILE: README.md===",
      "# Docs",
      "```ts",
      "example();",
      "```",
      "More docs.",
      "===END===",
    ].join("\n");
    const result = parseFiles(input);
    expect(result.files[0].content).toContain("# Docs");
    expect(result.files[0].content).toContain("```ts");
    expect(result.files[0].content).toContain("example();");
    expect(result.files[0].content).toContain("More docs.");
  });
});
