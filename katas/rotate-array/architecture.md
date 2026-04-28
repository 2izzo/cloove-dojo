# Architecture

## Public API

```typescript
export function rotate<T>(arr: T[], k: number): void;
```

Single exported function. Mutates the input array in place.

## Implementation guidance

The three-reverse trick is the canonical in-place rotation:

1. Normalize `k = ((k % n) + n) % n` (handles negative and oversized k).
2. Reverse the whole array.
3. Reverse the first `k` elements.
4. Reverse the elements from `k` to the end.

Each reverse is a two-pointer in-place swap. Total: O(n) time,
O(1) extra space.

You can also use cyclic replacements (start at 0, place that element at
its destination, place the displaced element at ITS destination,
continue), but the three-reverse pattern is simpler.
