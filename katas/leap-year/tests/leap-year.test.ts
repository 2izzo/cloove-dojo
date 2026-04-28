import { describe, it, expect } from "vitest";
import { isLeapYear } from "../src/leap-year";

describe("isLeapYear", () => {
  it("returns true for years divisible by 4 but not 100", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(4)).toBe(true);
  });

  it("returns false for years not divisible by 4", () => {
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1)).toBe(false);
  });

  it("returns false for years divisible by 100 but not 400", () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2200)).toBe(false);
  });

  it("returns true for years divisible by 400", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1600)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
  });

  it("treats year 0 as divisible by 400", () => {
    expect(isLeapYear(0)).toBe(true);
  });

  it("returns a strict boolean", () => {
    expect(typeof isLeapYear(2024)).toBe("boolean");
    expect(typeof isLeapYear(2023)).toBe("boolean");
  });
});
