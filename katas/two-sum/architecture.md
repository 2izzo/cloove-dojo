# Architecture

## Public API

```typescript
export function twoSum(nums: number[], target: number): [number, number];
```

Single exported function. Returns a tuple of two indices. Throws on
inputs with no valid pair.

## Implementation guidance

Two solutions exist — both are accepted, both pass the tests:

**O(n²) brute force.** Two nested loops, check every pair.

**O(n) hash table.** Single pass: for each element `x` at index `i`,
look up whether `target - x` is already in the map; if yes, return
`[mappedIndex, i]`; if no, add `x → i` to the map.

The hash table version is the canonical "this is what makes the problem
interesting" solution. Either is correct for the tests; the hash table
is preferred for code quality.
