# Anagram Grouping

Given an array of strings, group them so that words that are anagrams of
one another end up in the same sub-array. Return the array of groups.

## Behavior

```
groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
  → [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]   // any order
  
groupAnagrams([])                  → []
groupAnagrams([""])                → [[""]]
groupAnagrams(["a"])               → [["a"]]
```

## Constraints

- Two strings are anagrams if they contain the same characters in the
  same counts. `"eat"` and `"ate"` are anagrams; `"eat"` and `"tea"` are
  too.
- Comparison is **case-sensitive** — `"Eat"` and `"eat"` are NOT in the
  same group.
- The order of groups in the output array does not matter. The order of
  strings *within* each group should preserve their order from the input.
- Empty string is a group of one (containing only `""`).
- The function never throws.
