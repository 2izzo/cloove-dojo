# Architecture

## Public API

```typescript
export function isLeapYear(year: number): boolean;
```

Single exported function. Returns a strict boolean.

## Implementation guidance

Two valid forms:

```ts
return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
```

…or as a guard ladder, most-specific-first:

```ts
if (year % 400 === 0) return true;
if (year % 100 === 0) return false;
return year % 4 === 0;
```

Both express the same rule. The single boolean expression is more
compact; the guard ladder is more legible if the rules grow.
