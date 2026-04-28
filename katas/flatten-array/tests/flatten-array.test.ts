import { describe, it, expect } from "vitest";
import { flatten } from "../src/flatten-array";

describe("flatten", () => {
  it("flattens an empty array", () => {
    expect(flatten([])).toEqual([]);
  });

  it("returns a flat array unchanged", () => {
    expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("flattens one level of nesting", () => {
    expect(flatten([1, [2, 3]])).toEqual([1, 2, 3]);
  });

  it("flattens deeply nested arrays", () => {
    expect(flatten([1, [2, [3, [4, [5]]]]])).toEqual([1, 2, 3, 4, 5]);
  });

  it("removes empty sub-arrays", () => {
    expect(flatten([[1, 2], [3], [], [4]])).toEqual([1, 2, 3, 4]);
  });

  it("preserves order depth-first", () => {
    expect(flatten([[1, [2, 3]], 4, [5]])).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles strings without splitting them", () => {
    expect(flatten(["a", ["b", ["c"]]])).toEqual(["a", "b", "c"]);
  });

  it("preserves null and undefined as values", () => {
    expect(flatten([1, [null, [undefined]]])).toEqual([1, null, undefined]);
  });

  it("handles a mix of types", () => {
    expect(flatten([1, ["two", [3.0, [true]]]])).toEqual([1, "two", 3.0, true]);
  });

  it("does not mutate the input", () => {
    const input = [1, [2, [3]]];
    const snapshot = JSON.stringify(input);
    flatten(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
