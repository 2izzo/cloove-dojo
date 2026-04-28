import { describe, it, expect } from "vitest";
import { encode } from "../src/caesar-cipher";

describe("caesar encode", () => {
  it("returns empty string for empty input", () => {
    expect(encode("", 5)).toBe("");
  });

  it("returns identity at shift 0", () => {
    expect(encode("hello", 0)).toBe("hello");
  });

  it("returns identity at shift 26", () => {
    expect(encode("hello", 26)).toBe("hello");
  });

  it("shifts simple lowercase", () => {
    expect(encode("abc", 1)).toBe("bcd");
  });

  it("wraps around z to a", () => {
    expect(encode("xyz", 3)).toBe("abc");
  });

  it("preserves uppercase", () => {
    expect(encode("ABC", 1)).toBe("BCD");
  });

  it("preserves mixed case per character", () => {
    expect(encode("AbC", 1)).toBe("BcD");
  });

  it("passes through non-letters unchanged", () => {
    expect(encode("Hello, World!", 13)).toBe("Uryyb, Jbeyq!");
  });

  it("normalizes shifts larger than 26", () => {
    expect(encode("hello", 27)).toBe(encode("hello", 1));
  });

  it("handles negative shifts", () => {
    expect(encode("hello", -1)).toBe("gdkkn");
  });

  it("handles large negative shifts", () => {
    expect(encode("hello", -27)).toBe(encode("hello", -1));
  });

  it("rot13 is its own inverse", () => {
    const original = "The Quick Brown Fox";
    expect(encode(encode(original, 13), 13)).toBe(original);
  });

  it("digits and whitespace are unchanged", () => {
    expect(encode("ab 12 cd", 1)).toBe("bc 12 de");
  });
});
