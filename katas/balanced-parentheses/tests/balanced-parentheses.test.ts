import { describe, it, expect } from "vitest";
import { isBalanced } from "../src/balanced-parentheses";

describe("isBalanced", () => {
  it("returns true for the empty string", () => {
    expect(isBalanced("")).toBe(true);
  });

  it("returns true for a simple balanced pair", () => {
    expect(isBalanced("()")).toBe(true);
    expect(isBalanced("[]")).toBe(true);
    expect(isBalanced("{}")).toBe(true);
  });

  it("returns true for adjacent balanced pairs", () => {
    expect(isBalanced("()[]{}")).toBe(true);
  });

  it("returns true for nested balanced pairs", () => {
    expect(isBalanced("({[]})")).toBe(true);
    expect(isBalanced("[({})]")).toBe(true);
    expect(isBalanced("(((((())))))")).toBe(true);
  });

  it("returns false for an unclosed opener", () => {
    expect(isBalanced("(")).toBe(false);
    expect(isBalanced("([")).toBe(false);
  });

  it("returns false for an unmatched closer", () => {
    expect(isBalanced(")")).toBe(false);
    expect(isBalanced("()]")).toBe(false);
  });

  it("returns false for a mismatched pair", () => {
    expect(isBalanced("(]")).toBe(false);
    expect(isBalanced("[}")).toBe(false);
  });

  it("returns false for interleaved (not nested) pairs", () => {
    expect(isBalanced("({)}")).toBe(false);
    expect(isBalanced("[(])")).toBe(false);
  });

  it("ignores non-bracket characters", () => {
    expect(isBalanced("a(b)c")).toBe(true);
    expect(isBalanced("foo[bar(baz)]qux")).toBe(true);
    expect(isBalanced("a(b)c]")).toBe(false);
  });

  it("returns true for a long well-balanced string", () => {
    expect(isBalanced("({})[()]{[()()]}")).toBe(true);
  });
});
