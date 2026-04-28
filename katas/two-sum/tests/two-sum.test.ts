import { describe, it, expect } from "vitest";
import { twoSum } from "../src/two-sum";

describe("twoSum", () => {
  it("finds the canonical pair", () => {
    expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
  });

  it("finds a pair not at the start", () => {
    expect(twoSum([3, 2, 4], 6)).toEqual([1, 2]);
  });

  it("handles duplicates", () => {
    expect(twoSum([3, 3], 6)).toEqual([0, 1]);
  });

  it("returns indices in ascending order (i < j)", () => {
    const result = twoSum([1, 2, 3, 4, 5], 9);
    expect(result[0]).toBeLessThan(result[1]);
  });

  it("returns indices into the original array", () => {
    expect(twoSum([10, 5, 1, 9], 11)).toEqual([0, 2]);
  });

  it("handles negative numbers", () => {
    expect(twoSum([-3, 4, 3, 90], 0)).toEqual([0, 2]);
  });

  it("handles a target of zero", () => {
    expect(twoSum([5, -5, 1], 0)).toEqual([0, 1]);
  });

  it("throws when no pair sums to target", () => {
    expect(() => twoSum([1, 2, 3], 100)).toThrow();
  });

  it("throws on a single-element array", () => {
    expect(() => twoSum([5], 5)).toThrow();
  });

  it("throws on an empty array", () => {
    expect(() => twoSum([], 0)).toThrow();
  });

  it("does not pair an index with itself", () => {
    expect(() => twoSum([3, 6], 6)).toThrow();
  });
});
