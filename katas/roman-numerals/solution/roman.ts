const ROMAN_MAP: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

const ROMAN_VALUES: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

export function toRoman(num: number): string {
  if (!Number.isInteger(num) || num < 1 || num > 3999) {
    throw new RangeError(`Cannot convert ${num} to Roman numeral (valid range: 1-3999)`);
  }

  let result = '';
  let remaining = num;

  for (const [value, symbol] of ROMAN_MAP) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result;
}

export function fromRoman(roman: string): number {
  if (!roman || !/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(roman)) {
    throw new Error(`Invalid Roman numeral: "${roman}"`);
  }

  let total = 0;

  for (let i = 0; i < roman.length; i++) {
    const current = ROMAN_VALUES[roman[i]];
    const next = ROMAN_VALUES[roman[i + 1]];

    if (next && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }

  return total;
}
