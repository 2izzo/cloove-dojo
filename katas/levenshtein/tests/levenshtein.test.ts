import { describe, it, expect } from "vitest";
import { distance } from "../src/levenshtein";

describe("distance", () => {
  it("returns 0 for two empty strings", () => {
    expect(distance("", "")).toBe(0);
  });

  it("returns the length of the non-empty string when one is empty", () => {
    expect(distance("a", "")).toBe(1);
    expect(distance("", "abc")).toBe(3);
    expect(distance("hello", "")).toBe(5);
  });

  it("returns 0 for identical strings", () => {
    expect(distance("abc", "abc")).toBe(0);
    expect(distance("hello world", "hello world")).toBe(0);
  });

  it("counts a single substitution", () => {
    expect(distance("a", "b")).toBe(1);
    expect(distance("abc", "abd")).toBe(1);
  });

  it("counts a single insertion", () => {
    expect(distance("ac", "abc")).toBe(1);
  });

  it("counts a single deletion", () => {
    expect(distance("abc", "ac")).toBe(1);
  });

  it("computes the canonical kitten/sitting case (3)", () => {
    expect(distance("kitten", "sitting")).toBe(3);
  });

  it("computes flaw/lawn (2)", () => {
    expect(distance("flaw", "lawn")).toBe(2);
  });

  it("is symmetric", () => {
    expect(distance("apple", "ample")).toBe(distance("ample", "apple"));
  });

  it("handles longer strings quickly", () => {
    const a = "a".repeat(100);
    const b = "b".repeat(100);
    const start = Date.now();
    expect(distance(a, b)).toBe(100);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
