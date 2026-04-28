import { describe, it, expect } from "vitest";
import { winner } from "../src/tic-tac-toe";

describe("winner", () => {
  it("returns null for an empty board", () => {
    expect(winner(".........")).toBe(null);
  });

  it("detects X top row", () => {
    expect(winner("XXX......")).toBe("X");
  });

  it("detects X middle row", () => {
    expect(winner("...XXX...")).toBe("X");
  });

  it("detects X bottom row", () => {
    expect(winner("......XXX")).toBe("X");
  });

  it("detects X left column", () => {
    expect(winner("X..X..X..")).toBe("X");
  });

  it("detects X middle column", () => {
    expect(winner(".X..X..X.")).toBe("X");
  });

  it("detects X right column", () => {
    expect(winner("..X..X..X")).toBe("X");
  });

  it("detects X main diagonal", () => {
    expect(winner("X...X...X")).toBe("X");
  });

  it("detects X anti-diagonal", () => {
    expect(winner("..X.X.X..")).toBe("X");
  });

  it("detects O wins", () => {
    expect(winner("OOO......")).toBe("O");
    expect(winner("O...O...O")).toBe("O");
    expect(winner("..O..O..O")).toBe("O");
  });

  it("returns null for a non-winning full board", () => {
    expect(winner("XOXOXOOXO")).toBe(null);
  });

  it("returns null for partial play with no winner", () => {
    expect(winner("XOX.O....")).toBe(null);
  });

  it("throws on wrong length", () => {
    expect(() => winner("XXX")).toThrow();
    expect(() => winner("X".repeat(10))).toThrow();
  });

  it("throws on illegal characters", () => {
    expect(() => winner("YYY......")).toThrow();
    expect(() => winner("XX1......")).toThrow();
  });
});
