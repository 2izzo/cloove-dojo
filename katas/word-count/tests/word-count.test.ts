import { describe, it, expect } from "vitest";
import { wordCount } from "../src/word-count";

describe("wordCount", () => {
  it("returns empty object for empty string", () => {
    expect(wordCount("")).toEqual({});
  });

  it("counts a single word", () => {
    expect(wordCount("hello")).toEqual({ hello: 1 });
  });

  it("counts a duplicate word", () => {
    expect(wordCount("hello hello")).toEqual({ hello: 2 });
  });

  it("counts multiple distinct words", () => {
    expect(wordCount("hello world hello")).toEqual({ hello: 2, world: 1 });
  });

  it("is case-insensitive", () => {
    expect(wordCount("Hello hello HELLO")).toEqual({ hello: 3 });
  });

  it("strips punctuation but keeps internal apostrophes", () => {
    expect(wordCount("don't stop, won't quit")).toEqual({
      "don't": 1, stop: 1, "won't": 1, quit: 1,
    });
  });

  it("strips leading and trailing apostrophes", () => {
    const r = wordCount("'hello' 'world");
    expect(r.hello).toBe(1);
    expect(r.world).toBe(1);
  });

  it("handles multi-space input", () => {
    expect(wordCount("one  two   three")).toEqual({ one: 1, two: 1, three: 1 });
  });

  it("ignores digit-only tokens", () => {
    const r = wordCount("hello 42 world");
    expect(r.hello).toBe(1);
    expect(r.world).toBe(1);
    expect(r["42"]).toBeUndefined();
  });

  it("counts words from a longer sentence", () => {
    const result = wordCount("The quick brown fox jumps over the lazy dog. The dog sleeps.");
    expect(result.the).toBe(3);
    expect(result.dog).toBe(2);
    expect(result.fox).toBe(1);
  });
});
