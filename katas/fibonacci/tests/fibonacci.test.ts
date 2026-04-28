import { describe, it, expect } from "vitest";
import { fib } from "../src/fibonacci";

describe("fib", () => {
  it("fib(0) is 0", () => {
    expect(fib(0)).toBe(0);
  });

  it("fib(1) is 1", () => {
    expect(fib(1)).toBe(1);
  });

  it("fib(2) is 1", () => {
    expect(fib(2)).toBe(1);
  });

  it("fib(3) is 2", () => {
    expect(fib(3)).toBe(2);
  });

  it("fib(10) is 55", () => {
    expect(fib(10)).toBe(55);
  });

  it("fib(20) is 6765", () => {
    expect(fib(20)).toBe(6765);
  });

  it("fib(30) is 832040", () => {
    expect(fib(30)).toBe(832040);
  });

  it("fib(50) returns the correct value quickly", () => {
    const start = Date.now();
    expect(fib(50)).toBe(12586269025);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("throws on negative n", () => {
    expect(() => fib(-1)).toThrow();
  });
});
