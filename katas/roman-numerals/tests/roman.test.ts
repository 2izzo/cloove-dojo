import { describe, it, expect } from 'vitest';
import { toRoman, fromRoman } from '../roman';

describe('toRoman', () => {
  it('converts single digits', () => {
    expect(toRoman(1)).toBe('I');
    expect(toRoman(5)).toBe('V');
    expect(toRoman(10)).toBe('X');
  });

  it('converts subtractive forms', () => {
    expect(toRoman(4)).toBe('IV');
    expect(toRoman(9)).toBe('IX');
    expect(toRoman(40)).toBe('XL');
    expect(toRoman(90)).toBe('XC');
    expect(toRoman(400)).toBe('CD');
    expect(toRoman(900)).toBe('CM');
  });

  it('converts compound numbers', () => {
    expect(toRoman(14)).toBe('XIV');
    expect(toRoman(42)).toBe('XLII');
    expect(toRoman(99)).toBe('XCIX');
    expect(toRoman(1994)).toBe('MCMXCIV');
    expect(toRoman(3999)).toBe('MMMCMXCIX');
  });

  it('converts boundary values', () => {
    expect(toRoman(1)).toBe('I');
    expect(toRoman(3999)).toBe('MMMCMXCIX');
  });

  it('throws on invalid input', () => {
    expect(() => toRoman(0)).toThrow();
    expect(() => toRoman(-1)).toThrow();
    expect(() => toRoman(4000)).toThrow();
    expect(() => toRoman(1.5)).toThrow();
  });
});

describe('fromRoman', () => {
  it('converts basic numerals', () => {
    expect(fromRoman('I')).toBe(1);
    expect(fromRoman('V')).toBe(5);
    expect(fromRoman('X')).toBe(10);
    expect(fromRoman('L')).toBe(50);
    expect(fromRoman('C')).toBe(100);
    expect(fromRoman('D')).toBe(500);
    expect(fromRoman('M')).toBe(1000);
  });

  it('converts subtractive forms', () => {
    expect(fromRoman('IV')).toBe(4);
    expect(fromRoman('IX')).toBe(9);
    expect(fromRoman('XL')).toBe(40);
    expect(fromRoman('XC')).toBe(90);
    expect(fromRoman('CD')).toBe(400);
    expect(fromRoman('CM')).toBe(900);
  });

  it('converts compound numerals', () => {
    expect(fromRoman('XIV')).toBe(14);
    expect(fromRoman('XLII')).toBe(42);
    expect(fromRoman('XCIX')).toBe(99);
    expect(fromRoman('MCMXCIV')).toBe(1994);
  });

  it('round-trips with toRoman', () => {
    for (const n of [1, 4, 9, 14, 40, 42, 90, 99, 400, 900, 1994, 3999]) {
      expect(fromRoman(toRoman(n))).toBe(n);
    }
  });

  it('throws on invalid input', () => {
    expect(() => fromRoman('')).toThrow();
    expect(() => fromRoman('IIII')).toThrow();
    expect(() => fromRoman('ABC')).toThrow();
  });
});
