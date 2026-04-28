import { describe, it, expect } from "vitest";
import { shortestPath } from "../src/graph-bfs";

const sample: Record<string, string[]> = {
  A: ["B", "C"],
  B: ["A", "D"],
  C: ["A", "D"],
  D: ["B", "C", "E"],
  E: ["D"],
};

describe("shortestPath", () => {
  it("returns [start] when start === end", () => {
    expect(shortestPath(sample, "A", "A")).toEqual(["A"]);
  });

  it("finds a one-edge path", () => {
    const r = shortestPath(sample, "A", "B");
    expect(r).toEqual(["A", "B"]);
  });

  it("finds a multi-edge path with correct length", () => {
    const r = shortestPath(sample, "A", "E");
    expect(r).not.toBeNull();
    expect(r![0]).toBe("A");
    expect(r![r!.length - 1]).toBe("E");
    expect(r!.length).toBe(4); // A -> (B|C) -> D -> E
  });

  it("returns null when end is not in graph", () => {
    expect(shortestPath(sample, "A", "Z")).toBeNull();
  });

  it("returns null when start is not in graph", () => {
    expect(shortestPath(sample, "Z", "A")).toBeNull();
  });

  it("returns null when end is unreachable", () => {
    const disconnected: Record<string, string[]> = {
      A: ["B"],
      B: ["A"],
      X: ["Y"],
      Y: ["X"],
    };
    expect(shortestPath(disconnected, "A", "X")).toBeNull();
  });

  it("returns null on empty graph", () => {
    expect(shortestPath({}, "A", "B")).toBeNull();
  });

  it("handles a linear chain", () => {
    const chain: Record<string, string[]> = {
      A: ["B"], B: ["A", "C"], C: ["B", "D"], D: ["C"],
    };
    expect(shortestPath(chain, "A", "D")).toEqual(["A", "B", "C", "D"]);
  });

  it("prefers shorter over longer", () => {
    // A connects directly to D, AND through B-C
    const g: Record<string, string[]> = {
      A: ["B", "D"], B: ["A", "C"], C: ["B", "D"], D: ["A", "C"],
    };
    const r = shortestPath(g, "A", "D");
    expect(r!.length).toBe(2);
  });

  it("never throws", () => {
    expect(() => shortestPath({}, "", "")).not.toThrow();
  });
});
