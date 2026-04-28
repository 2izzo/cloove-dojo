import { describe, it, expect } from "vitest";
import { primesUpTo } from "../src/prime-sieve";

describe("primesUpTo", () => {
  it("returns [] for n=0", () => {
    expect(primesUpTo(0)).toEqual([]);
  });

  it("returns [] for n=1", () => {
    expect(primesUpTo(1)).toEqual([]);
  });

  it("returns [2] for n=2", () => {
    expect(primesUpTo(2)).toEqual([2]);
  });

  it("returns [2, 3] for n=3", () => {
    expect(primesUpTo(3)).toEqual([2, 3]);
  });

  it("returns [2, 3, 5, 7] for n=10", () => {
    expect(primesUpTo(10)).toEqual([2, 3, 5, 7]);
  });

  it("returns the first ten primes for n=30", () => {
    expect(primesUpTo(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  });

  it("returns sorted ascending output", () => {
    const result = primesUpTo(50);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1]);
    }
  });

  it("includes n itself when n is prime (e.g. n=13)", () => {
    expect(primesUpTo(13)).toContain(13);
  });

  it("excludes n itself when n is composite (e.g. n=12)", () => {
    expect(primesUpTo(12)).not.toContain(12);
  });

  it("throws on negative input", () => {
    expect(() => primesUpTo(-1)).toThrow();
    expect(() => primesUpTo(-100)).toThrow();
  });
});
