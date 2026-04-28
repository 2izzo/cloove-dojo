# Architecture

## Public API

```typescript
export function groupAnagrams(words: string[]): string[][];
```

Single exported function. Returns an array of groups; each group is an
array of strings that are pairwise anagrams.

## Implementation guidance

The canonical solution uses a hash map keyed by a normalized form of
each word:

1. For each word, compute a canonical key — typically the word's
   characters sorted alphabetically (`"eat" → "aet"`, `"tea" → "aet"`).
2. Insert the word into a map's entry for that key, creating the entry
   if needed.
3. Return the map's values.

A character-count signature also works as the key (`"a:1,e:1,t:1"`),
and is faster than sort for long words.
