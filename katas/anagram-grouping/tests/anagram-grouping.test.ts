import { describe, it, expect } from "vitest";
import { groupAnagrams } from "../src/anagram-grouping";

// Tests are tolerant of group order and within-group order, since both
// are unspecified by the problem (other than "preserve input order
// within each group" — but we test that separately).
function normalize(groups: string[][]): string[][] {
  return groups.map((g) => g.slice().sort()).sort((a, b) => a.join().localeCompare(b.join()));
}

describe("groupAnagrams", () => {
  it("returns an empty array for empty input", () => {
    expect(groupAnagrams([])).toEqual([]);
  });

  it("returns one group for one element", () => {
    expect(groupAnagrams(["a"])).toEqual([["a"]]);
  });

  it("returns one group for the empty string", () => {
    expect(groupAnagrams([""])).toEqual([[""]]);
  });

  it("groups two anagrams together", () => {
    const result = groupAnagrams(["eat", "tea"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("eat");
    expect(result[0]).toContain("tea");
  });

  it("groups the canonical example correctly", () => {
    const result = groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
    expect(normalize(result)).toEqual(
      normalize([["eat", "tea", "ate"], ["tan", "nat"], ["bat"]])
    );
  });

  it("treats case-sensitively", () => {
    const result = groupAnagrams(["Eat", "eat"]);
    expect(result).toHaveLength(2);
  });

  it("preserves input order within a group", () => {
    const result = groupAnagrams(["tea", "eat", "ate"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(["tea", "eat", "ate"]);
  });

  it("handles single-character anagrams", () => {
    const result = groupAnagrams(["a", "b", "a"]);
    expect(normalize(result)).toEqual(normalize([["a", "a"], ["b"]]));
  });

  it("handles long anagrams", () => {
    const result = groupAnagrams(["debit card", "bad credit"]);
    expect(result).toHaveLength(1);
  });
});
