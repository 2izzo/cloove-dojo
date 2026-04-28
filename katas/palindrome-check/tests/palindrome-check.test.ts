import { describe, it, expect } from "vitest";
import { isPalindrome } from "../src/palindrome-check";

describe("isPalindrome", () => {
  it("returns true for the empty string", () => {
    expect(isPalindrome("")).toBe(true);
  });

  it("returns true for a single character", () => {
    expect(isPalindrome("a")).toBe(true);
  });

  it("returns true for a simple odd-length palindrome", () => {
    expect(isPalindrome("aba")).toBe(true);
  });

  it("returns true for a simple even-length palindrome", () => {
    expect(isPalindrome("abba")).toBe(true);
  });

  it("returns true for 'racecar'", () => {
    expect(isPalindrome("racecar")).toBe(true);
  });

  it("returns false for a non-palindrome", () => {
    expect(isPalindrome("hello")).toBe(false);
  });

  it("ignores case", () => {
    expect(isPalindrome("RaceCar")).toBe(true);
  });

  it("ignores non-alphanumeric characters", () => {
    expect(isPalindrome("A man, a plan, a canal: Panama")).toBe(true);
    expect(isPalindrome("Was it a car or a cat I saw?")).toBe(true);
    expect(isPalindrome("No 'x' in Nixon")).toBe(true);
  });

  it("considers digits in the alphanumeric set", () => {
    expect(isPalindrome("12321")).toBe(true);
    expect(isPalindrome("12345")).toBe(false);
  });

  it("returns false on a slight asymmetry (one letter different)", () => {
    // "abxBa" (lowercased "abxba") differs at position 2 vs 2 — wait, actually
    // "abxba" reversed is "abxba" so it IS a palindrome. Use a true asymmetry.
    expect(isPalindrome("abcba?nope")).toBe(false);
  });

  it("treats a string of only punctuation as a palindrome", () => {
    expect(isPalindrome(".,!?")).toBe(true);
  });
});
