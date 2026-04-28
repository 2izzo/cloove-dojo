import { describe, it, expect } from "vitest";
import { encode, decode } from "../src/run-length-encoding";

describe("encode", () => {
  it("encodes the empty string", () => {
    expect(encode("")).toBe("");
  });

  it("encodes a single character as 1<char>", () => {
    expect(encode("A")).toBe("1A");
  });

  it("encodes a simple run", () => {
    expect(encode("AAA")).toBe("3A");
  });

  it("encodes multiple runs", () => {
    expect(encode("AAAABBBCCDAA")).toBe("4A3B2C1D2A");
  });

  it("uses multi-digit counts when the run is long", () => {
    expect(encode("AAAAAAAAAAAA")).toBe("12A");
  });

  it("handles non-letter characters", () => {
    expect(encode("  !!!")).toBe("2 3!");
  });
});

describe("decode", () => {
  it("decodes the empty string", () => {
    expect(decode("")).toBe("");
  });

  it("decodes a single run", () => {
    expect(decode("3A")).toBe("AAA");
  });

  it("decodes multiple runs", () => {
    expect(decode("4A3B2C1D2A")).toBe("AAAABBBCCDAA");
  });

  it("decodes multi-digit counts", () => {
    expect(decode("12A")).toBe("AAAAAAAAAAAA");
  });

  it("throws on a non-digit start", () => {
    expect(() => decode("A3")).toThrow();
  });

  it("throws on trailing digits without a char", () => {
    expect(() => decode("3A2")).toThrow();
  });
});

describe("encode/decode roundtrip", () => {
  it("decode is the inverse of encode", () => {
    const cases = ["", "A", "ABC", "AAABBB", "Hello, World!"];
    for (const s of cases) {
      expect(decode(encode(s))).toBe(s);
    }
  });
});
