import { describe, it, expect } from "vitest";
import { isValidIsbn10 } from "../src/valid-isbn";

describe("isValidIsbn10", () => {
  it("accepts a known-good ISBN", () => {
    expect(isValidIsbn10("0306406152")).toBe(true);
  });

  it("ignores hyphens", () => {
    expect(isValidIsbn10("0-306-40615-2")).toBe(true);
  });

  it("accepts X as check digit", () => {
    // 043942089X is a real ISBN-10 (Harry Potter and the Philosopher's Stone)
    expect(isValidIsbn10("043942089X")).toBe(true);
    expect(isValidIsbn10("0-43-942089-X")).toBe(true);
    expect(isValidIsbn10("123456789X")).toBe(true);
  });

  it("rejects a wrong checksum", () => {
    // 0306406151 is 0306406152 (valid) with the last digit altered
    expect(isValidIsbn10("0306406151")).toBe(false);
  });

  it("rejects too-short input", () => {
    expect(isValidIsbn10("359821507")).toBe(false);
    expect(isValidIsbn10("")).toBe(false);
  });

  it("rejects too-long input", () => {
    expect(isValidIsbn10("03064061520")).toBe(false);
  });

  it("rejects X in non-final position", () => {
    expect(isValidIsbn10("X123456789")).toBe(false);
  });

  it("rejects lowercase x", () => {
    expect(isValidIsbn10("123456789x")).toBe(false);
  });

  it("rejects letters in digit positions", () => {
    expect(isValidIsbn10("0306A06152")).toBe(false);
  });

  it("never throws", () => {
    expect(() => isValidIsbn10("")).not.toThrow();
    expect(() => isValidIsbn10("garbage!@#$%")).not.toThrow();
  });
});
