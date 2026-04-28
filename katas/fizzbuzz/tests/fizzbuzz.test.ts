import { describe, it, expect } from "vitest";
import { fizzbuzz } from "../src/fizzbuzz";

describe("fizzbuzz", () => {
  it("returns [] for n=0", () => {
    expect(fizzbuzz(0)).toEqual([]);
  });

  it("returns ['1'] for n=1", () => {
    expect(fizzbuzz(1)).toEqual(["1"]);
  });

  it("emits 'Fizz' for multiples of 3", () => {
    const result = fizzbuzz(9);
    expect(result[2]).toBe("Fizz");
    expect(result[5]).toBe("Fizz");
    expect(result[8]).toBe("Fizz");
  });

  it("emits 'Buzz' for multiples of 5", () => {
    const result = fizzbuzz(10);
    expect(result[4]).toBe("Buzz");
    expect(result[9]).toBe("Buzz");
  });

  it("emits 'FizzBuzz' for multiples of 15", () => {
    const result = fizzbuzz(30);
    expect(result[14]).toBe("FizzBuzz");
    expect(result[29]).toBe("FizzBuzz");
  });

  it("emits the canonical first 15", () => {
    expect(fizzbuzz(15)).toEqual([
      "1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz",
      "11","Fizz","13","14","FizzBuzz",
    ]);
  });

  it("returns strings for plain numbers", () => {
    const result = fizzbuzz(2);
    expect(typeof result[0]).toBe("string");
    expect(typeof result[1]).toBe("string");
  });

  it("throws on negative n", () => {
    expect(() => fizzbuzz(-1)).toThrow();
  });
});
