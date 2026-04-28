import { describe, it, expect } from "vitest";
import { rotate } from "../src/rotate-array";

describe("rotate", () => {
  it("rotates by 0 is a no-op", () => {
    const a = [1, 2, 3, 4, 5];
    rotate(a, 0);
    expect(a).toEqual([1, 2, 3, 4, 5]);
  });

  it("rotates a 5-element array by 2", () => {
    const a = [1, 2, 3, 4, 5];
    rotate(a, 2);
    expect(a).toEqual([4, 5, 1, 2, 3]);
  });

  it("rotates a 5-element array by 1", () => {
    const a = [1, 2, 3, 4, 5];
    rotate(a, 1);
    expect(a).toEqual([5, 1, 2, 3, 4]);
  });

  it("rotates by k = length is a no-op", () => {
    const a = [1, 2, 3];
    rotate(a, 3);
    expect(a).toEqual([1, 2, 3]);
  });

  it("normalizes k > length", () => {
    // k=5, length=3 → 5 mod 3 = 2 → rotate right by 2 → [2, 3, 1]
    const a = [1, 2, 3];
    rotate(a, 5);
    expect(a).toEqual([2, 3, 1]);
  });

  it("rotates left for negative k", () => {
    const a = [1, 2, 3];
    rotate(a, -1);
    expect(a).toEqual([2, 3, 1]);
  });

  it("normalizes large negative k", () => {
    const a = [1, 2, 3];
    rotate(a, -4);
    expect(a).toEqual([2, 3, 1]);
  });

  it("handles empty array", () => {
    const a: number[] = [];
    rotate(a, 3);
    expect(a).toEqual([]);
  });

  it("handles single-element array", () => {
    const a = [42];
    rotate(a, 5);
    expect(a).toEqual([42]);
  });

  it("works for strings", () => {
    const a = ["a", "b", "c", "d"];
    rotate(a, 1);
    expect(a).toEqual(["d", "a", "b", "c"]);
  });

  it("does NOT replace the array reference", () => {
    const a = [1, 2, 3];
    const original = a;
    rotate(a, 1);
    expect(a).toBe(original);
    expect(a).toEqual([3, 1, 2]);
  });
});
